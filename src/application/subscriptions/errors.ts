export const getSubscriptionErrorMessage = (
  error: unknown,
  fallbackMessage = "The action could not be completed.",
) => (error instanceof Error ? error.message : fallbackMessage);

export const hasUserScope = (userId: string | undefined | null): userId is string =>
  typeof userId === "string" && userId.length > 0;
