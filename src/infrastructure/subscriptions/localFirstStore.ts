import AsyncStorage from "@react-native-async-storage/async-storage";

import { SubscriptionError } from "@/application/subscriptions/errors";
import {
  buildChangeEvents,
  buildCreatedEvent,
  getMissingPaymentHistoryEvents,
  sortHistoryNewestFirst,
} from "@/domain/subscriptionHistory/events";
import {
  buildEditablePaymentEventFields,
  buildUpdatedPaymentEvent,
  hasActivePaymentEventForDueDate,
  isEditablePaymentEventType,
} from "@/domain/subscriptionHistory/paymentEvents";
import {
  archiveFirestoreSubscription,
  createFirestoreHistoryEvent,
  createFirestoreSubscription,
  deleteFirestoreHistoryEventDirect,
  subscribeToFirestoreSubscriptionHistory,
  subscribeToFirestoreSubscriptions,
  syncFirestoreSubscriptionHistoryFromSnapshot,
  updateFirestoreHistoryEventFromSnapshot,
  updateFirestoreSubscription,
  updateFirestoreSubscriptionFromSnapshot,
} from "@/services/firestore/subscriptionFirestore";
import { sanitizeHistoryEventForFirestore } from "@/services/firestore/payloadSanitizer";
import { EntitySyncState, Subscription, SubscriptionInput } from "@/types/subscription";
import { HistoryEventInput, SubscriptionHistoryEvent } from "@/types/subscriptionHistory";
import { logFirestoreError } from "@/utils/firestoreDebug";

type SubscriptionListener = (items: Subscription[]) => void;
type HistoryListener = (items: SubscriptionHistoryEvent[]) => void;
type HistoryProjectionListener = (items: SubscriptionHistoryEvent[]) => void;
type UserStatsProjectionListener = (stats: UserStatsProjection) => void;

export type UserStatsProjection = {
  subscriptionCount: number;
  pendingSubscriptionsCount: number;
  hasSyncErrors: boolean;
};

type EditableHistoryPayload = {
  type: "payment_booked" | "payment_skipped_inactive";
  amount: number;
  dueDate: string;
  notes?: string;
};

type OutboxMeta = {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
};

type SubscriptionCreateOp = OutboxMeta & {
  type: "subscription:create";
  subscriptionId: string;
  input: SubscriptionInput;
  localSubscription: Subscription;
};

type SubscriptionUpdateOp = OutboxMeta & {
  type: "subscription:update";
  subscriptionId: string;
  patch: Partial<SubscriptionInput>;
  baseUpdatedAt?: string;
};

type SubscriptionArchiveOp = OutboxMeta & {
  type: "subscription:archive";
  subscriptionId: string;
  baseUpdatedAt?: string;
};

type HistoryCreateOp = OutboxMeta & {
  type: "history:create";
  subscriptionId: string;
  event: SubscriptionHistoryEvent;
};

type HistoryUpdateOp = OutboxMeta & {
  type: "history:update";
  subscriptionId: string;
  eventId: string;
  event: SubscriptionHistoryEvent;
};

type HistoryDeleteOp = OutboxMeta & {
  type: "history:delete";
  subscriptionId: string;
  eventId: string;
};

type OutboxOperation =
  | SubscriptionCreateOp
  | SubscriptionUpdateOp
  | SubscriptionArchiveOp
  | HistoryCreateOp
  | HistoryUpdateOp
  | HistoryDeleteOp;

type PersistedUserState = {
  version: 1;
  remoteSubscriptions: Record<string, Subscription>;
  remoteHistory: Record<string, Record<string, SubscriptionHistoryEvent>>;
  outbox: OutboxOperation[];
  lastRetryAt?: string;
};

type UserRuntimeState = PersistedUserState & {
  isHydrated: boolean;
  isFlushing: boolean;
  currentSyncOpId?: string;
};

const STORAGE_PREFIX = "tracker.local-first-subscriptions.v1";

const createStorageKey = (userId: string) => `${STORAGE_PREFIX}:${userId}`;

const createLocalId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const buildOpMeta = (): OutboxMeta => {
  const now = new Date().toISOString();

  return {
    id: createLocalId("op"),
    createdAt: now,
    updatedAt: now,
  };
};

const getDefaultUserState = (): UserRuntimeState => ({
  version: 1,
  remoteSubscriptions: {},
  remoteHistory: {},
  outbox: [],
  lastRetryAt: undefined,
  isHydrated: false,
  isFlushing: false,
  currentSyncOpId: undefined,
});

const toPersistedState = (state: UserRuntimeState): PersistedUserState => ({
  version: 1,
  remoteSubscriptions: state.remoteSubscriptions,
  remoteHistory: state.remoteHistory,
  outbox: state.outbox,
  lastRetryAt: state.lastRetryAt,
});

const isSubscriptionCreateOp = (
  operation: OutboxOperation,
): operation is SubscriptionCreateOp => operation.type === "subscription:create";

const isSubscriptionUpdateOp = (
  operation: OutboxOperation,
): operation is SubscriptionUpdateOp => operation.type === "subscription:update";

const isSubscriptionArchiveOp = (
  operation: OutboxOperation,
): operation is SubscriptionArchiveOp => operation.type === "subscription:archive";

const isHistoryCreateOp = (operation: OutboxOperation): operation is HistoryCreateOp =>
  operation.type === "history:create";

const isHistoryUpdateOp = (operation: OutboxOperation): operation is HistoryUpdateOp =>
  operation.type === "history:update";

const isHistoryDeleteOp = (operation: OutboxOperation): operation is HistoryDeleteOp =>
  operation.type === "history:delete";

const mapSubscriptionById = (items: Subscription[]) =>
  Object.fromEntries(items.map((item) => [item.id, item])) as Record<string, Subscription>;

const mapHistoryById = (items: SubscriptionHistoryEvent[]) =>
  Object.fromEntries(items.map((item) => [item.id, item])) as Record<string, SubscriptionHistoryEvent>;

const toSubscriptionInput = (subscription: Subscription): SubscriptionInput => ({
  name: subscription.name,
  category: subscription.category,
  amount: subscription.amount,
  billingCycle: subscription.billingCycle,
  nextPaymentDate: subscription.nextPaymentDate,
  status: subscription.status,
  endDate: subscription.endDate,
  notes: subscription.notes,
});

const removeUndefinedFields = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;

const sortSubscriptions = (items: Subscription[]) =>
  [...items].sort((left, right) => left.nextPaymentDate.localeCompare(right.nextPaymentDate));

const buildSyntheticCreatedEvent = (subscription: Subscription): SubscriptionHistoryEvent =>
  ({
    ...buildCreatedEvent(subscription.id, subscription),
    id: buildCreatedEvent(subscription.id, subscription).id ?? `subscription_created_${subscription.id}`,
    subscriptionId: subscription.id,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
    syncState: subscription.syncState,
  }) as SubscriptionHistoryEvent;

const mergeSubscriptionPatch = (
  subscription: Subscription,
  patch: Partial<SubscriptionInput>,
): Subscription => ({
  ...subscription,
  ...removeUndefinedFields(patch),
  updatedAt: new Date().toISOString(),
});

const serializeError = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const toHistoryCreateInput = (event: SubscriptionHistoryEvent): HistoryEventInput => ({
  ...sanitizeHistoryEventForFirestore(event),
  id: event.id,
  createdAt: event.createdAt,
});

const toEditableHistoryPayload = (
  event: SubscriptionHistoryEvent,
): EditableHistoryPayload => {
  if (!isEditablePaymentEventType(event.type) || typeof event.amount !== "number" || !event.dueDate) {
    throw new Error("Only editable payment events can be synchronized with update semantics.");
  }

  return {
    type: event.type,
    amount: event.amount,
    dueDate: event.dueDate,
    notes: event.notes,
  };
};

const buildEntitySyncState = ({
  localOnly,
  isSyncing,
  hasRelevantOperations,
  hasError,
  lastError,
}: {
  localOnly: boolean;
  isSyncing: boolean;
  hasRelevantOperations: boolean;
  hasError: boolean;
  lastError?: string;
}): EntitySyncState => {
  if (!hasRelevantOperations) {
    return {
      status: "synced",
      isPending: false,
      isSyncing: false,
      hasError: false,
      localOnly: false,
      retryPending: false,
    };
  }

  if (localOnly) {
    return {
      status: "localOnly",
      isPending: true,
      isSyncing,
      hasError,
      localOnly: true,
      retryPending: hasError,
      lastError,
    };
  }

  if (hasError) {
    return {
      status: "retryPending",
      isPending: true,
      isSyncing: false,
      hasError: true,
      localOnly: false,
      retryPending: true,
      lastError,
    };
  }

  if (isSyncing) {
    return {
      status: "syncing",
      isPending: true,
      isSyncing: true,
      hasError: false,
      localOnly: false,
      retryPending: false,
      lastError,
    };
  }

  return {
    status: "pending",
    isPending: true,
    isSyncing: false,
    hasError,
    localOnly: false,
    retryPending: false,
    lastError,
  };
};

export class LocalFirstSubscriptionStore {
  private userStates = new Map<string, UserRuntimeState>();
  private hydrationPromises = new Map<string, Promise<void>>();
  private flushPromises = new Map<string, Promise<void>>();
  private subscriptionListeners = new Map<string, Set<SubscriptionListener>>();
  private userStatsProjectionListeners = new Map<string, Set<UserStatsProjectionListener>>();
  private historyListeners = new Map<string, Map<string, Set<HistoryListener>>>();
  private historyProjectionListeners = new Map<
    string,
    Map<string, { subscriptionIds: string[]; listeners: Set<HistoryProjectionListener> }>
  >();
  private remoteSubscriptionUnsubscribers = new Map<string, () => void>();
  private remoteHistoryUnsubscribers = new Map<string, Map<string, () => void>>();

  private getUserState(userId: string) {
    const existing = this.userStates.get(userId);
    if (existing) {
      return existing;
    }

    const nextState = getDefaultUserState();
    this.userStates.set(userId, nextState);
    return nextState;
  }

  private async persistUserState(userId: string) {
    const state = this.getUserState(userId);
    await AsyncStorage.setItem(createStorageKey(userId), JSON.stringify(toPersistedState(state)));
  }

  async hydrateUser(userId: string) {
    const existingPromise = this.hydrationPromises.get(userId);
    if (existingPromise) {
      await existingPromise;
      return;
    }

    const hydratePromise = (async () => {
      const state = this.getUserState(userId);
      if (state.isHydrated) {
        return;
      }

      try {
        const rawValue = await AsyncStorage.getItem(createStorageKey(userId));
        if (rawValue) {
          const parsed = JSON.parse(rawValue) as Partial<PersistedUserState>;
          state.remoteSubscriptions = parsed.remoteSubscriptions ?? {};
          state.remoteHistory = parsed.remoteHistory ?? {};
          state.outbox = Array.isArray(parsed.outbox) ? parsed.outbox : [];
          state.lastRetryAt = parsed.lastRetryAt;
        }
      } catch (error) {
        logFirestoreError("localFirstSubscriptionStore.hydrateUser", error, {
          userId,
        });
      } finally {
        state.isHydrated = true;
        this.emitUser(userId);
      }
    })();

    this.hydrationPromises.set(userId, hydratePromise);

    try {
      await hydratePromise;
    } finally {
      this.hydrationPromises.delete(userId);
    }
  }

  private emitUser(userId: string) {
    const subscriptionListeners = this.subscriptionListeners.get(userId);
    const mergedSubscriptions = this.getMergedSubscriptions(userId);
    subscriptionListeners?.forEach((listener) => listener(mergedSubscriptions));
    const userStatsProjection = this.getUserStatsProjection(userId, mergedSubscriptions);
    this.userStatsProjectionListeners.get(userId)?.forEach((listener) => listener(userStatsProjection));

    const historyListeners = this.historyListeners.get(userId);
    historyListeners?.forEach((listeners, subscriptionId) => {
      const mergedHistory = this.getMergedHistory(userId, subscriptionId);
      listeners.forEach((listener) => listener(mergedHistory));
    });

    const projectionListeners = this.historyProjectionListeners.get(userId);
    projectionListeners?.forEach(({ subscriptionIds, listeners }) => {
      const mergedProjection = this.getMergedHistoryProjection(userId, subscriptionIds);
      listeners.forEach((listener) => listener(mergedProjection));
    });
  }

  private emitHistory(userId: string, subscriptionId: string) {
    const listeners = this.historyListeners.get(userId)?.get(subscriptionId);
    const mergedHistory = this.getMergedHistory(userId, subscriptionId);
    listeners?.forEach((listener) => listener(mergedHistory));

    const projectionListeners = this.historyProjectionListeners.get(userId);
    projectionListeners?.forEach(({ subscriptionIds, listeners: projectionSet }) => {
      if (!subscriptionIds.includes(subscriptionId)) {
        return;
      }

      const mergedProjection = this.getMergedHistoryProjection(userId, subscriptionIds);
      projectionSet.forEach((listener) => listener(mergedProjection));
    });
  }

  private async ensureRemoteHistoryFeed(
    userId: string,
    subscriptionId: string,
    onError?: (error: Error) => void,
  ) {
    const unsubscribersBySubscription =
      this.remoteHistoryUnsubscribers.get(userId) ?? new Map<string, () => void>();

    if (unsubscribersBySubscription.has(subscriptionId)) {
      return;
    }

    const unsubscribe = subscribeToFirestoreSubscriptionHistory(
      userId,
      subscriptionId,
      async (history) => {
        const state = this.getUserState(userId);
        state.remoteHistory[subscriptionId] = mapHistoryById(history);
        await this.persistUserState(userId);
        this.emitUser(userId);
      },
      onError,
    );

    unsubscribersBySubscription.set(subscriptionId, unsubscribe);
    this.remoteHistoryUnsubscribers.set(userId, unsubscribersBySubscription);
  }

  private async ensureRemoteSubscriptionFeed(
    userId: string,
    onError?: (error: Error) => void,
  ) {
    if (this.remoteSubscriptionUnsubscribers.has(userId)) {
      return;
    }

    const unsubscribe = subscribeToFirestoreSubscriptions(
      userId,
      async (subscriptions) => {
        const state = this.getUserState(userId);
        state.remoteSubscriptions = mapSubscriptionById(subscriptions);
        await this.persistUserState(userId);
        this.emitUser(userId);
      },
      onError,
    );

    this.remoteSubscriptionUnsubscribers.set(userId, unsubscribe);
  }

  private upsertOutbox(userId: string, nextOutbox: OutboxOperation[]) {
    const state = this.getUserState(userId);
    state.outbox = nextOutbox;
  }

  private getRelevantOutboxForSubscription(userId: string, subscriptionId: string) {
    const state = this.getUserState(userId);
    return state.outbox.filter((operation) => {
      if ("subscriptionId" in operation) {
        return operation.subscriptionId === subscriptionId;
      }

      return false;
    });
  }

  private getSubscriptionSyncState(userId: string, subscriptionId: string): EntitySyncState {
    const state = this.getUserState(userId);
    const relevantOperations = state.outbox.filter(
      (operation) =>
        (isSubscriptionCreateOp(operation) ||
          isSubscriptionUpdateOp(operation) ||
          isSubscriptionArchiveOp(operation)) &&
        operation.subscriptionId === subscriptionId,
    );
    const hasRelevantOperations = relevantOperations.length > 0;
    const createOperation = relevantOperations.find((operation) =>
      isSubscriptionCreateOp(operation),
    ) as SubscriptionCreateOp | undefined;
    const localOnly = Boolean(createOperation) && !this.getRemoteSubscription(userId, subscriptionId);
    const syncingOperation = relevantOperations.find(
      (operation) => operation.id === state.currentSyncOpId,
    );
    const failedOperation = relevantOperations.find((operation) => operation.lastError);

    return buildEntitySyncState({
      localOnly,
      isSyncing: Boolean(syncingOperation),
      hasRelevantOperations,
      hasError: Boolean(failedOperation?.lastError),
      lastError: failedOperation?.lastError,
    });
  }

  private getHistoryEventSyncState(
    userId: string,
    subscriptionId: string,
    eventId: string,
  ): EntitySyncState {
    const state = this.getUserState(userId);
    const relevantOperations = state.outbox.filter((operation) => {
      if (isHistoryCreateOp(operation)) {
        return operation.subscriptionId === subscriptionId && operation.event.id === eventId;
      }

      if (isHistoryUpdateOp(operation) || isHistoryDeleteOp(operation)) {
        return operation.subscriptionId === subscriptionId && operation.eventId === eventId;
      }

      return false;
    });
    const hasRelevantOperations = relevantOperations.length > 0;
    const createOperation = relevantOperations.find((operation) =>
      isHistoryCreateOp(operation),
    ) as HistoryCreateOp | undefined;
    const localOnly =
      Boolean(createOperation) &&
      !(this.getUserState(userId).remoteHistory[subscriptionId]?.[eventId]);
    const syncingOperation = relevantOperations.find(
      (operation) => operation.id === state.currentSyncOpId,
    );
    const failedOperation = relevantOperations.find((operation) => operation.lastError);

    return buildEntitySyncState({
      localOnly,
      isSyncing: Boolean(syncingOperation),
      hasRelevantOperations,
      hasError: Boolean(failedOperation?.lastError),
      lastError: failedOperation?.lastError,
    });
  }

  private buildLocalPendingChangeEvents(userId: string, subscriptionId: string) {
    const baseSubscription = this.getRemoteSubscription(userId, subscriptionId);
    const subscription = this.getMergedSubscriptions(userId).find((item) => item.id === subscriptionId);

    if (!baseSubscription || !subscription) {
      return [] as SubscriptionHistoryEvent[];
    }

    const relevantOperations = this.getRelevantOutboxForSubscription(userId, subscriptionId).filter(
      (operation) =>
        isSubscriptionUpdateOp(operation) || isSubscriptionArchiveOp(operation),
    );

    if (relevantOperations.length === 0) {
      return [] as SubscriptionHistoryEvent[];
    }

    const hasPendingCreate = this.getRelevantOutboxForSubscription(userId, subscriptionId).some(
      (operation) => isSubscriptionCreateOp(operation),
    );
    if (hasPendingCreate) {
      return [] as SubscriptionHistoryEvent[];
    }

    const effectiveDate = new Date().toISOString().slice(0, 10);
    const syncState = this.getSubscriptionSyncState(userId, subscriptionId);
    const eventTimestamp =
      [...relevantOperations]
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]?.updatedAt ??
      new Date().toISOString();

    return buildChangeEvents(baseSubscription, subscription, effectiveDate).map((event, index) => ({
      ...(event as SubscriptionHistoryEvent),
      id: event.id ?? `local_pending_${subscriptionId}_${event.type}_${index}`,
      subscriptionId,
      createdAt: event.createdAt ?? eventTimestamp,
      updatedAt: eventTimestamp,
      syncState,
    }));
  }

  getMergedSubscriptions(userId: string) {
    const state = this.getUserState(userId);
    const subscriptionsById = { ...state.remoteSubscriptions };

    state.outbox.forEach((operation) => {
      if (isSubscriptionCreateOp(operation)) {
        subscriptionsById[operation.subscriptionId] = operation.localSubscription;
        return;
      }

      if (isSubscriptionUpdateOp(operation)) {
        const current = subscriptionsById[operation.subscriptionId];
        if (!current) {
          return;
        }

        subscriptionsById[operation.subscriptionId] = mergeSubscriptionPatch(current, operation.patch);
        return;
      }

      if (isSubscriptionArchiveOp(operation)) {
        const current = subscriptionsById[operation.subscriptionId];
        if (!current) {
          return;
        }

        subscriptionsById[operation.subscriptionId] = {
          ...current,
          archivedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    });

    return sortSubscriptions(
      Object.values(subscriptionsById)
        .filter((subscription) => !subscription.archivedAt)
        .map((subscription) => ({
          ...subscription,
          syncState: this.getSubscriptionSyncState(userId, subscription.id),
        })),
    );
  }

  getUserStatsProjection(userId: string, subscriptions = this.getMergedSubscriptions(userId)): UserStatsProjection {
    return {
      subscriptionCount: subscriptions.length,
      pendingSubscriptionsCount: subscriptions.filter((subscription) => subscription.syncState?.isPending)
        .length,
      hasSyncErrors: subscriptions.some((subscription) => subscription.syncState?.hasError),
    };
  }

  getMergedHistory(userId: string, subscriptionId: string) {
    const state = this.getUserState(userId);
    const historyById = {
      ...(state.remoteHistory[subscriptionId] ?? {}),
    };
    const subscription = this.getMergedSubscriptions(userId).find((item) => item.id === subscriptionId);

    this.getRelevantOutboxForSubscription(userId, subscriptionId).forEach((operation) => {
      if (isHistoryCreateOp(operation)) {
        historyById[operation.event.id] = operation.event;
        return;
      }

      if (isHistoryUpdateOp(operation)) {
        historyById[operation.eventId] = operation.event;
        return;
      }

      if (isHistoryDeleteOp(operation)) {
        const current = historyById[operation.eventId];
        if (!current) {
          return;
        }

        historyById[operation.eventId] = {
          ...current,
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    });

    const items = Object.values(historyById);
    const hasCreatedEvent = items.some((event) => event.type === "subscription_created" && !event.deletedAt);

    if (subscription && !hasCreatedEvent) {
      items.push(buildSyntheticCreatedEvent(subscription));
    }

    const localPendingChangeEvents = this.buildLocalPendingChangeEvents(userId, subscriptionId);

    return sortHistoryNewestFirst([...items, ...localPendingChangeEvents]).map((event) => ({
      ...event,
      syncState: event.syncState ?? this.getHistoryEventSyncState(userId, subscriptionId, event.id),
    }));
  }

  private getEffectiveActiveMergedHistory(userId: string, subscriptionId: string) {
    return this.getMergedHistory(userId, subscriptionId).filter((event) => !event.deletedAt);
  }

  getMergedHistoryProjection(userId: string, subscriptionIds: string[]) {
    const uniqueSubscriptionIds = [...new Set(subscriptionIds)].filter(Boolean);

    return sortHistoryNewestFirst(
      uniqueSubscriptionIds.flatMap((subscriptionId) =>
        this.getMergedHistory(userId, subscriptionId).filter((event) => !event.deletedAt),
      ),
    );
  }

  private getRemoteSubscription(userId: string, subscriptionId: string) {
    return this.getUserState(userId).remoteSubscriptions[subscriptionId] ?? null;
  }

  async connectSubscriptionFeed(
    userId: string,
    listener: SubscriptionListener,
    onError?: (error: Error) => void,
  ) {
    await this.hydrateUser(userId);
    const listeners = this.subscriptionListeners.get(userId) ?? new Set<SubscriptionListener>();
    listeners.add(listener);
    this.subscriptionListeners.set(userId, listeners);
    listener(this.getMergedSubscriptions(userId));

    await this.ensureRemoteSubscriptionFeed(userId, onError);

    return () => {
      const nextListeners = this.subscriptionListeners.get(userId);
      nextListeners?.delete(listener);
    };
  }

  async connectUserStatsProjection(
    userId: string,
    listener: UserStatsProjectionListener,
    onError?: (error: Error) => void,
  ) {
    await this.hydrateUser(userId);
    const listeners = this.userStatsProjectionListeners.get(userId) ?? new Set<UserStatsProjectionListener>();
    listeners.add(listener);
    this.userStatsProjectionListeners.set(userId, listeners);
    listener(this.getUserStatsProjection(userId));

    await this.ensureRemoteSubscriptionFeed(userId, onError);

    return () => {
      const nextListeners = this.userStatsProjectionListeners.get(userId);
      nextListeners?.delete(listener);
    };
  }

  async connectHistoryFeed(
    userId: string,
    subscriptionId: string,
    listener: HistoryListener,
    onError?: (error: Error) => void,
  ) {
    await this.hydrateUser(userId);
    const listenersBySubscription = this.historyListeners.get(userId) ?? new Map<string, Set<HistoryListener>>();
    const listeners = listenersBySubscription.get(subscriptionId) ?? new Set<HistoryListener>();
    listeners.add(listener);
    listenersBySubscription.set(subscriptionId, listeners);
    this.historyListeners.set(userId, listenersBySubscription);
    listener(this.getMergedHistory(userId, subscriptionId));

    await this.ensureRemoteHistoryFeed(userId, subscriptionId, onError);

    return () => {
      const nextListeners = this.historyListeners.get(userId)?.get(subscriptionId);
      nextListeners?.delete(listener);
    };
  }

  async connectHistoryProjection(
    userId: string,
    subscriptionIds: string[],
    listener: HistoryProjectionListener,
    onError?: (error: Error) => void,
  ) {
    await this.hydrateUser(userId);
    const stableSubscriptionIds = [...new Set(subscriptionIds)].sort();
    const projectionKey = stableSubscriptionIds.join("|");
    const projectionsByUser = this.historyProjectionListeners.get(userId) ?? new Map();
    const existingProjection = projectionsByUser.get(projectionKey) ?? {
      subscriptionIds: stableSubscriptionIds,
      listeners: new Set<HistoryProjectionListener>(),
    };

    existingProjection.subscriptionIds = stableSubscriptionIds;
    existingProjection.listeners.add(listener);
    projectionsByUser.set(projectionKey, existingProjection);
    this.historyProjectionListeners.set(userId, projectionsByUser);

    await Promise.all(
      stableSubscriptionIds.map((subscriptionId) =>
        this.ensureRemoteHistoryFeed(userId, subscriptionId, onError),
      ),
    );

    listener(this.getMergedHistoryProjection(userId, stableSubscriptionIds));

    return () => {
      const currentProjection = this.historyProjectionListeners.get(userId)?.get(projectionKey);
      currentProjection?.listeners.delete(listener);

      if (currentProjection && currentProjection.listeners.size === 0) {
        this.historyProjectionListeners.get(userId)?.delete(projectionKey);
      }
    };
  }

  async enqueueCreateSubscription(userId: string, input: SubscriptionInput) {
    await this.hydrateUser(userId);
    const now = new Date().toISOString();
    const subscriptionId = createLocalId("subscription");
    const localSubscription: Subscription = {
      id: subscriptionId,
      ...input,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };

    const state = this.getUserState(userId);
    state.outbox = [
      ...state.outbox,
      {
        ...buildOpMeta(),
        type: "subscription:create",
        subscriptionId,
        input,
        localSubscription,
      },
    ];
    await this.persistUserState(userId);
    this.emitUser(userId);
    return localSubscription;
  }

  async enqueueUpdateSubscription(
    userId: string,
    subscriptionId: string,
    patch: Partial<SubscriptionInput>,
  ) {
    await this.hydrateUser(userId);
    const state = this.getUserState(userId);
    const createIndex = state.outbox.findIndex(
      (operation) => isSubscriptionCreateOp(operation) && operation.subscriptionId === subscriptionId,
    );

    if (createIndex >= 0) {
      const createOperation = state.outbox[createIndex] as SubscriptionCreateOp;
      const nextSubscription = mergeSubscriptionPatch(createOperation.localSubscription, patch);
      state.outbox.splice(createIndex, 1, {
        ...createOperation,
        input: {
          ...createOperation.input,
          ...removeUndefinedFields(patch),
        },
        localSubscription: nextSubscription,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const updateIndex = state.outbox.findIndex(
        (operation) => isSubscriptionUpdateOp(operation) && operation.subscriptionId === subscriptionId,
      );
      const nextPatch = updateIndex >= 0
        ? {
            ...(state.outbox[updateIndex] as SubscriptionUpdateOp).patch,
            ...removeUndefinedFields(patch),
          }
        : removeUndefinedFields(patch);

      const nextOperation: SubscriptionUpdateOp = {
        ...buildOpMeta(),
        type: "subscription:update",
        subscriptionId,
        patch: nextPatch,
        baseUpdatedAt: this.getRemoteSubscription(userId, subscriptionId)?.updatedAt,
      };

      if (updateIndex >= 0) {
        state.outbox.splice(updateIndex, 1, nextOperation);
      } else {
        state.outbox = [...state.outbox, nextOperation];
      }
    }

    await this.persistUserState(userId);
    this.emitUser(userId);
  }

  async enqueueArchiveSubscription(userId: string, subscriptionId: string) {
    await this.hydrateUser(userId);
    const state = this.getUserState(userId);
    const hasPendingCreate = state.outbox.some(
      (operation) => isSubscriptionCreateOp(operation) && operation.subscriptionId === subscriptionId,
    );

    if (hasPendingCreate) {
      state.outbox = state.outbox.filter((operation) => {
        if ("subscriptionId" in operation && operation.subscriptionId === subscriptionId) {
          return false;
        }

        return true;
      });
    } else {
      state.outbox = state.outbox.filter((operation) => {
        if (isSubscriptionUpdateOp(operation) && operation.subscriptionId === subscriptionId) {
          return false;
        }

        return true;
      });

      const hasArchive = state.outbox.some(
        (operation) => isSubscriptionArchiveOp(operation) && operation.subscriptionId === subscriptionId,
      );

      if (!hasArchive) {
        state.outbox = [
          ...state.outbox,
          {
            ...buildOpMeta(),
            type: "subscription:archive",
            subscriptionId,
            baseUpdatedAt: this.getRemoteSubscription(userId, subscriptionId)?.updatedAt,
          },
        ];
      }
    }

    await this.persistUserState(userId);
    this.emitUser(userId);
  }

  private getEditableMergedHistoryEvent(userId: string, subscriptionId: string, eventId: string) {
    const currentEvent = this.getMergedHistory(userId, subscriptionId).find((event) => event.id === eventId);

    if (!currentEvent || !isEditablePaymentEventType(currentEvent.type) || currentEvent.deletedAt) {
      throw new Error("Only editable payment events can be updated.");
    }

    return currentEvent as SubscriptionHistoryEvent & {
      type: "payment_booked" | "payment_skipped_inactive";
    };
  }

  async enqueueCreateManualPayment(
    userId: string,
    subscriptionId: string,
    input: EditableHistoryPayload,
  ) {
    await this.hydrateUser(userId);
    const mergedHistory = this.getEffectiveActiveMergedHistory(userId, subscriptionId);
    if (hasActivePaymentEventForDueDate(mergedHistory, input.dueDate)) {
      throw new SubscriptionError("duplicate_payment_due_date");
    }

    const now = new Date().toISOString();
    const eventId = createLocalId("manual_payment");
    const event: SubscriptionHistoryEvent = {
      id: eventId,
      subscriptionId,
      ...buildEditablePaymentEventFields(input),
      createdAt: now,
      updatedAt: now,
    };

    const state = this.getUserState(userId);
    state.outbox = [
      ...state.outbox,
      {
        ...buildOpMeta(),
        type: "history:create",
        subscriptionId,
        event,
      },
    ];

    await this.persistUserState(userId);
    this.emitHistory(userId, subscriptionId);
  }

  async enqueueCreateHistoryEvent(
    userId: string,
    subscriptionId: string,
    event: HistoryEventInput,
  ) {
    await this.hydrateUser(userId);
    const now = new Date().toISOString();
    const nextEvent: SubscriptionHistoryEvent = {
      ...(event as SubscriptionHistoryEvent),
      id: event.id ?? createLocalId(event.type),
      subscriptionId,
      createdAt: event.createdAt ?? now,
      updatedAt: event.updatedAt ?? now,
    };
    const state = this.getUserState(userId);
    state.outbox = [
      ...state.outbox,
      {
        ...buildOpMeta(),
        type: "history:create",
        subscriptionId,
        event: nextEvent,
      },
    ];

    await this.persistUserState(userId);
    this.emitHistory(userId, subscriptionId);
  }

  async enqueueUpdateHistoryEvent(
    userId: string,
    subscriptionId: string,
    eventId: string,
    input: EditableHistoryPayload,
  ) {
    await this.hydrateUser(userId);
    const mergedHistory = this.getEffectiveActiveMergedHistory(userId, subscriptionId);
    const currentEvent = this.getEditableMergedHistoryEvent(userId, subscriptionId, eventId);

    if (hasActivePaymentEventForDueDate(mergedHistory, input.dueDate, eventId)) {
      throw new SubscriptionError("duplicate_payment_due_date");
    }

    const now = new Date().toISOString();
    const nextEvent: SubscriptionHistoryEvent = {
      ...currentEvent,
      ...buildUpdatedPaymentEvent({
        currentEvent,
        input,
        now,
      }),
    };

    const state = this.getUserState(userId);
    const createIndex = state.outbox.findIndex(
      (operation) =>
        isHistoryCreateOp(operation) &&
        operation.subscriptionId === subscriptionId &&
        operation.event.id === eventId,
    );

    if (createIndex >= 0) {
      const createOperation = state.outbox[createIndex] as HistoryCreateOp;
      state.outbox.splice(createIndex, 1, {
        ...createOperation,
        event: nextEvent,
        updatedAt: now,
      });
    } else {
      const updateIndex = state.outbox.findIndex(
        (operation) =>
          isHistoryUpdateOp(operation) &&
          operation.subscriptionId === subscriptionId &&
          operation.eventId === eventId,
      );
      const nextOperation: HistoryUpdateOp = {
        ...buildOpMeta(),
        type: "history:update",
        subscriptionId,
        eventId,
        event: nextEvent,
      };

      if (updateIndex >= 0) {
        state.outbox.splice(updateIndex, 1, nextOperation);
      } else {
        state.outbox = [...state.outbox, nextOperation];
      }
    }

    await this.persistUserState(userId);
    this.emitHistory(userId, subscriptionId);
  }

  async enqueueDeleteHistoryEvent(userId: string, subscriptionId: string, eventId: string) {
    await this.hydrateUser(userId);
    this.getEditableMergedHistoryEvent(userId, subscriptionId, eventId);
    const state = this.getUserState(userId);
    const createIndex = state.outbox.findIndex(
      (operation) =>
        isHistoryCreateOp(operation) &&
        operation.subscriptionId === subscriptionId &&
        operation.event.id === eventId,
    );

    if (createIndex >= 0) {
      state.outbox = state.outbox.filter((operation, index) => index !== createIndex);
    } else {
      state.outbox = state.outbox.filter((operation) => {
        if (isHistoryUpdateOp(operation) && operation.subscriptionId === subscriptionId && operation.eventId === eventId) {
          return false;
        }

        return true;
      });

      const hasDelete = state.outbox.some(
        (operation) =>
          isHistoryDeleteOp(operation) &&
          operation.subscriptionId === subscriptionId &&
          operation.eventId === eventId,
      );

      if (!hasDelete) {
        state.outbox = [
          ...state.outbox,
          {
            ...buildOpMeta(),
            type: "history:delete",
            subscriptionId,
            eventId,
          },
        ];
      }
    }

    await this.persistUserState(userId);
    this.emitHistory(userId, subscriptionId);
  }

  async enqueueDerivedHistorySync(userId: string, subscriptions: Subscription[]) {
    await this.hydrateUser(userId);
    const state = this.getUserState(userId);
    let hasChanges = false;

    subscriptions.forEach((subscription) => {
      const mergedHistory = this.getEffectiveActiveMergedHistory(userId, subscription.id);
      const missingEvents = getMissingPaymentHistoryEvents(subscription, mergedHistory);

      missingEvents.forEach((event) => {
        const eventId = event.id;
        if (!eventId) {
          return;
        }

        const alreadyQueued = state.outbox.some(
          (operation) =>
            isHistoryCreateOp(operation) &&
            operation.subscriptionId === subscription.id &&
            operation.event.id === eventId,
        );

        if (alreadyQueued) {
          return;
        }

        hasChanges = true;
        state.outbox = [
          ...state.outbox,
          {
            ...buildOpMeta(),
            type: "history:create",
            subscriptionId: subscription.id,
            event: {
              ...(event as SubscriptionHistoryEvent),
              id: eventId,
              subscriptionId: subscription.id,
              createdAt: new Date().toISOString(),
            },
          },
        ];
      });
    });

    if (!hasChanges) {
      return;
    }

    await this.persistUserState(userId);
    this.emitUser(userId);
  }

  async retryPending(userId: string) {
    await this.hydrateUser(userId);
    await this.flush(userId);
  }

  private markOpFailed(userId: string, opId: string, error: unknown) {
    const state = this.getUserState(userId);
    state.outbox = state.outbox.map((operation) =>
      operation.id === opId
        ? {
            ...operation,
            lastError: serializeError(error),
            updatedAt: new Date().toISOString(),
          }
        : operation,
    );
  }

  private removeOutboxOperation(userId: string, opId: string) {
    const state = this.getUserState(userId);
    state.outbox = state.outbox.filter((operation) => operation.id !== opId);
  }

  private async applySuccessfulRemoteAck(userId: string, operation: OutboxOperation) {
    const state = this.getUserState(userId);

    if (isSubscriptionCreateOp(operation)) {
      state.remoteSubscriptions[operation.subscriptionId] = operation.localSubscription;
      return;
    }

    if (isSubscriptionUpdateOp(operation)) {
      const current = state.remoteSubscriptions[operation.subscriptionId];
      if (current) {
        state.remoteSubscriptions[operation.subscriptionId] = {
          ...current,
          ...removeUndefinedFields(operation.patch),
          updatedAt: new Date().toISOString(),
        };
      }
      return;
    }

    if (isSubscriptionArchiveOp(operation)) {
      const current = state.remoteSubscriptions[operation.subscriptionId];
      if (current) {
        state.remoteSubscriptions[operation.subscriptionId] = {
          ...current,
          archivedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return;
    }

    if (isHistoryCreateOp(operation)) {
      const history = state.remoteHistory[operation.subscriptionId] ?? {};
      const { syncState: _ignoredSyncState, ...persistedEvent } = operation.event;
      state.remoteHistory[operation.subscriptionId] = {
        ...history,
        [operation.event.id]: persistedEvent,
      };
      return;
    }

    if (isHistoryUpdateOp(operation)) {
      const history = state.remoteHistory[operation.subscriptionId] ?? {};
      const { syncState: _ignoredSyncState, ...persistedEvent } = operation.event;
      state.remoteHistory[operation.subscriptionId] = {
        ...history,
        [operation.eventId]: persistedEvent,
      };
      return;
    }

    if (isHistoryDeleteOp(operation)) {
      const history = state.remoteHistory[operation.subscriptionId] ?? {};
      const current = history[operation.eventId];
      if (current) {
        state.remoteHistory[operation.subscriptionId] = {
          ...history,
          [operation.eventId]: {
            ...current,
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
      }
    }
  }

  private async flushOperation(userId: string, operation: OutboxOperation) {
    if (isSubscriptionCreateOp(operation)) {
      const mergedHistory = this.getMergedHistory(userId, operation.subscriptionId);
      await createFirestoreSubscription(userId, operation.input, {
        subscriptionId: operation.subscriptionId,
        skipHistorySync: true,
      });
      await syncFirestoreSubscriptionHistoryFromSnapshot(
        userId,
        operation.localSubscription,
        mergedHistory,
      );
      return;
    }

    if (isSubscriptionUpdateOp(operation)) {
      const previousSubscription = this.getRemoteSubscription(userId, operation.subscriptionId);

      if (!previousSubscription) {
        await updateFirestoreSubscription(userId, operation.subscriptionId, operation.patch);
        return;
      }

      const nextSubscription = mergeSubscriptionPatch(previousSubscription, operation.patch);
      const effectiveDate = operation.updatedAt.slice(0, 10);
      const events = buildChangeEvents(previousSubscription, nextSubscription, effectiveDate);
      const mergedHistory = this.getMergedHistory(userId, operation.subscriptionId);

      await updateFirestoreSubscriptionFromSnapshot(userId, operation.subscriptionId, operation.patch, {
        events,
        nextSubscription,
        historySnapshot: mergedHistory,
      });
      return;
    }

    if (isSubscriptionArchiveOp(operation)) {
      await archiveFirestoreSubscription(userId, operation.subscriptionId);
      return;
    }

    if (isHistoryCreateOp(operation)) {
      await createFirestoreHistoryEvent(
        userId,
        operation.subscriptionId,
        toHistoryCreateInput(operation.event),
      );
      return;
    }

    if (isHistoryUpdateOp(operation)) {
      await updateFirestoreHistoryEventFromSnapshot(
        userId,
        operation.subscriptionId,
        operation.event as SubscriptionHistoryEvent & {
          type: "payment_booked" | "payment_skipped_inactive";
        },
      );
      return;
    }

    await deleteFirestoreHistoryEventDirect(userId, operation.subscriptionId, operation.eventId);
  }

  async flush(userId: string) {
    const existingPromise = this.flushPromises.get(userId);
    if (existingPromise) {
      await existingPromise;
      return;
    }

    const flushPromise = (async () => {
      await this.hydrateUser(userId);
      const state = this.getUserState(userId);
      if (state.isFlushing) {
        return;
      }

      state.isFlushing = true;
      state.currentSyncOpId = undefined;
      state.lastRetryAt = new Date().toISOString();

      try {
        while (state.outbox.length > 0) {
          const [nextOperation] = state.outbox;
          state.currentSyncOpId = nextOperation.id;
          this.emitUser(userId);
          try {
            await this.flushOperation(userId, nextOperation);
            await this.applySuccessfulRemoteAck(userId, nextOperation);
            this.removeOutboxOperation(userId, nextOperation.id);
            state.currentSyncOpId = undefined;
            await this.persistUserState(userId);
            this.emitUser(userId);
          } catch (error) {
            this.markOpFailed(userId, nextOperation.id, error);
            state.currentSyncOpId = undefined;
            await this.persistUserState(userId);
            this.emitUser(userId);
            throw error;
          }
        }
      } finally {
        state.isFlushing = false;
        state.currentSyncOpId = undefined;
      }
    })();

    this.flushPromises.set(userId, flushPromise);

    try {
      await flushPromise;
    } catch (error) {
      logFirestoreError("localFirstSubscriptionStore.flush", error, { userId });
    } finally {
      this.flushPromises.delete(userId);
    }
  }
}

export const localFirstSubscriptionStore = new LocalFirstSubscriptionStore();
