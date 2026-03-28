export const getSubscriptionErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Aktion konnte nicht ausgefuehrt werden.";

export const hasUserScope = (userId: string | undefined | null): userId is string =>
  typeof userId === "string" && userId.length > 0;
