const extractUrl = (message: string) => {
  const match = message.match(/https:\/\/[^\s]+/);
  return match?.[0];
};

export const getFirestoreErrorDetails = (error: unknown) => {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : undefined;
  const message = error instanceof Error ? error.message : String(error);
  const customData =
    error && typeof error === "object" && "customData" in error
      ? error.customData
      : undefined;
  const serialized = (() => {
    try {
      return JSON.stringify(
        {
          name: error instanceof Error ? error.name : undefined,
          code,
          message,
          customData,
          stack: error instanceof Error ? error.stack : undefined,
          raw:
            error && typeof error === "object"
              ? Object.getOwnPropertyNames(error).reduce<Record<string, unknown>>((acc, key) => {
                  acc[key] = (error as Record<string, unknown>)[key];
                  return acc;
                }, {})
              : error,
        },
        null,
        2,
      );
    } catch {
      return String(error);
    }
  })();
  const missingIndexUrl = extractUrl(message);

  return {
    code,
    message,
    customData,
    serialized,
    missingIndexUrl,
  };
};

export const logFirestoreError = (
  scope: string,
  error: unknown,
  context?: Record<string, unknown>,
) => {
  const details = getFirestoreErrorDetails(error);

  console.error(`[Firestore] ${scope}:error`, {
    ...context,
    code: details.code,
    message: details.message,
    customData: details.customData,
    serialized: details.serialized,
  });
  console.error(`[Firestore] ${scope}:message`, details.message);

  if (details.code) {
    console.error(`[Firestore] ${scope}:code`, details.code);
  }

  if (details.customData !== undefined) {
    console.error(`[Firestore] ${scope}:customData`, details.customData);
  }

  console.error(`[Firestore] ${scope}:serialized`, details.serialized);

  if (details.missingIndexUrl) {
    console.error(`[Firestore] Missing index URL: ${details.missingIndexUrl}`);
  }
};
