import test from "node:test";
import assert from "node:assert/strict";

import { sortHistoryNewestFirst } from "../../src/domain/subscriptionHistory/events.ts";
import type { SubscriptionHistoryEvent } from "../../src/types/subscriptionHistory.ts";

const createEvent = (
  overrides: Partial<SubscriptionHistoryEvent>,
): SubscriptionHistoryEvent => ({
  id: "event-1",
  subscriptionId: "subscription-1",
  type: "payment_booked",
  createdAt: "2026-03-29T10:00:00.000Z",
  ...overrides,
});

test("sorts events from the same calendar day by newer createdAt first", () => {
  const older = createEvent({
    id: "older",
    createdAt: "2026-03-29T10:00:00.000Z",
    effectiveDate: "2026-03-29",
  });
  const newer = createEvent({
    id: "newer",
    createdAt: "2026-03-29T11:30:00.000Z",
    effectiveDate: "2026-03-29",
  });

  const result = sortHistoryNewestFirst([older, newer]);

  assert.deepEqual(result.map((event) => event.id), ["newer", "older"]);
});

test("prefers updatedAt over effectiveDate and createdAt for UI ordering", () => {
  const untouched = createEvent({
    id: "untouched",
    createdAt: "2026-03-29T10:00:00.000Z",
    effectiveDate: "2026-03-29",
  });
  const edited = createEvent({
    id: "edited",
    createdAt: "2026-03-29T09:00:00.000Z",
    updatedAt: "2026-03-29T12:00:00.000Z",
    effectiveDate: "2026-03-29",
  });

  const result = sortHistoryNewestFirst([untouched, edited]);

  assert.deepEqual(result.map((event) => event.id), ["edited", "untouched"]);
});

test("falls back to createdAt when updatedAt is missing", () => {
  const first = createEvent({
    id: "first",
    createdAt: "2026-03-29T08:00:00.000Z",
  });
  const second = createEvent({
    id: "second",
    createdAt: "2026-03-29T09:00:00.000Z",
  });

  const result = sortHistoryNewestFirst([first, second]);

  assert.deepEqual(result.map((event) => event.id), ["second", "first"]);
});

test("keeps sorting deterministic when timestamps match", () => {
  const a = createEvent({
    id: "a",
    createdAt: "2026-03-29T10:00:00.000Z",
  });
  const b = createEvent({
    id: "b",
    createdAt: "2026-03-29T10:00:00.000Z",
  });

  const firstPass = sortHistoryNewestFirst([a, b]).map((event) => event.id);
  const secondPass = sortHistoryNewestFirst([a, b]).map((event) => event.id);

  assert.deepEqual(firstPass, secondPass);
});
