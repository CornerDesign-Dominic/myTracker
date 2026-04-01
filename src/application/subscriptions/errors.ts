export type SubscriptionErrorCode = "duplicate_payment_due_date";

const DEFAULT_SUBSCRIPTION_ERROR_MESSAGES: Record<SubscriptionErrorCode, string> = {
  duplicate_payment_due_date: "A payment for this due date already exists.",
};

export class SubscriptionError extends Error {
  readonly code: SubscriptionErrorCode;

  constructor(code: SubscriptionErrorCode, message?: string) {
    super(message ?? DEFAULT_SUBSCRIPTION_ERROR_MESSAGES[code]);
    this.name = "SubscriptionError";
    this.code = code;
  }
}

export const getSubscriptionErrorMessage = (
  error: unknown,
  fallbackMessage = "The action could not be completed.",
) => (error instanceof Error ? error.message : fallbackMessage);

export const hasUserScope = (userId: string | undefined | null): userId is string =>
  typeof userId === "string" && userId.length > 0;
