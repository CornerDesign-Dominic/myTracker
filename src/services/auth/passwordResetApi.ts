const PASSWORD_RESET_API_BASE_URL = "https://europe-west1-mytracker-0.cloudfunctions.net";

type ApiErrorDetails = {
  code: string | null;
  message: string | null;
  status: number;
  body: string | null;
  contentType: string | null;
};

const parseErrorResponse = async (response: Response): Promise<ApiErrorDetails> => {
  const contentType = response.headers.get("content-type");

  try {
    const rawBody = await response.text();
    const trimmedBody = rawBody.trim();

    if (!trimmedBody) {
      return {
        code: null,
        message: null,
        status: response.status,
        body: null,
        contentType,
      };
    }

    try {
      const payload = JSON.parse(trimmedBody) as {
        error?: { code?: string; message?: string };
        message?: string;
      };

      return {
        code: payload.error?.code ?? null,
        message: payload.error?.message ?? payload.message ?? null,
        status: response.status,
        body: trimmedBody,
        contentType,
      };
    } catch {
      return {
        code: null,
        message: null,
        status: response.status,
        body: trimmedBody,
        contentType,
      };
    }
  } catch {
    return {
      code: null,
      message: null,
      status: response.status,
      body: null,
      contentType,
    };
  }
};

const createApiError = (code: string, details?: Partial<ApiErrorDetails>) => {
  const error = new Error(details?.message ?? code);
  (
    error as Error & {
      code?: string;
      status?: number;
      body?: string | null;
      contentType?: string | null;
    }
  ).code = code;
  (error as Error & { status?: number }).status = details?.status;
  (error as Error & { body?: string | null }).body = details?.body ?? null;
  (error as Error & { contentType?: string | null }).contentType = details?.contentType ?? null;
  return error;
};

export const passwordResetStartRequest = async (params: {
  email: string;
  source: string;
}) => {
  console.log("[AuthDebug] passwordResetApi:start:request", {
    url: `${PASSWORD_RESET_API_BASE_URL}/passwordResetStart`,
    method: "POST",
    email: params.email,
    source: params.source,
  });

  const response = await fetch(`${PASSWORD_RESET_API_BASE_URL}/passwordResetStart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      source: params.source,
    }),
  });

  if (!response.ok) {
    const errorDetails = await parseErrorResponse(response);
    const code = errorDetails.code ?? "password-reset-start-failed";
    console.log("[AuthDebug] passwordResetApi:start:error-response", {
      url: `${PASSWORD_RESET_API_BASE_URL}/passwordResetStart`,
      status: errorDetails.status,
      code,
      message: errorDetails.message,
      contentType: errorDetails.contentType,
      body: errorDetails.body,
      source: params.source,
    });
    throw createApiError(code, errorDetails);
  }

  console.log("[AuthDebug] passwordResetApi:start:success-response", {
    url: `${PASSWORD_RESET_API_BASE_URL}/passwordResetStart`,
    source: params.source,
  });
};
