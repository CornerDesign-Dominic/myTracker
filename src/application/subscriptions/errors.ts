export type SubscriptionErrorCode = "duplicate_payment_due_date";

export class SubscriptionError extends Error {
  constructor(
    public readonly code: SubscriptionErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "SubscriptionError";
  }
}

export const getSubscriptionErrorMessage = (
  error: unknown,
  fallbackMessage = "The action could not be completed.",
) => (error instanceof Error ? error.message : fallbackMessage);

export const hasUserScope = (userId: string | undefined | null): userId is string =>
  typeof userId === "string" && userId.length > 0;
