import { SubscriptionInput } from "@/types/subscription";
import { SubscriptionService } from "@/application/subscriptions/service";
import { getSubscriptionErrorMessage, hasUserScope } from "@/application/subscriptions/errors";
import { useI18n } from "@/hooks/useI18n";
import { logFirestoreError } from "@/utils/firestoreDebug";

type Options = {
  userId?: string | null;
  service: SubscriptionService;
  setErrorMessage: (value: string | null) => void;
};

export const useSubscriptionActions = ({ userId, service, setErrorMessage }: Options) => {
  const { t } = useI18n();

  const execute = async (action: () => Promise<void>) => {
    try {
      setErrorMessage(null);
      await action();
    } catch (error) {
      logFirestoreError("useSubscriptionActions.execute", error, {
        userId: userId ?? null,
      });
      setErrorMessage(getSubscriptionErrorMessage(error, t("common.actionFailed")));
    }
  };

  return {
    createSubscription: (input: SubscriptionInput) =>
      hasUserScope(userId)
        ? execute(() => service.createForUser(userId, input))
        : Promise.resolve(),
    updateSubscription: (id: string, input: Partial<SubscriptionInput>) =>
      hasUserScope(userId)
        ? execute(() => service.updateForUser(userId, id, input))
        : Promise.resolve(),
    archiveSubscription: (id: string) =>
      hasUserScope(userId)
        ? execute(() => service.archiveForUser(userId, id))
        : Promise.resolve(),
  };
};
