const REGISTRATION_API_BASE_URL = "https://europe-west1-mytracker-0.cloudfunctions.net";

const buildHeaders = (idToken: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${idToken}`,
});

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

const createApiError = (
  code: string,
  details?: Partial<ApiErrorDetails>,
) => {
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

export const startPendingRegistrationRequest = async (params: {
  idToken: string;
  email: string;
}) => {
  const response = await fetch(`${REGISTRATION_API_BASE_URL}/registrationStart`, {
    method: "POST",
    headers: buildHeaders(params.idToken),
    body: JSON.stringify({
      email: params.email,
    }),
  });

  if (!response.ok) {
    const errorDetails = await parseErrorResponse(response);
    const code = errorDetails.code ?? "pending-registration-start-failed";
    console.log("[AuthDebug] pendingRegistrationApi:start:error-response", {
      url: `${REGISTRATION_API_BASE_URL}/registrationStart`,
      status: errorDetails.status,
      code,
      message: errorDetails.message,
      contentType: errorDetails.contentType,
      body: errorDetails.body,
    });
    throw createApiError(code, errorDetails);
  }
};

export const resendPendingRegistrationRequest = async (params: {
  idToken: string;
}) => {
  const response = await fetch(`${REGISTRATION_API_BASE_URL}/registrationResend`, {
    method: "POST",
    headers: buildHeaders(params.idToken),
  });

  if (!response.ok) {
    const errorDetails = await parseErrorResponse(response);
    const code = errorDetails.code ?? "pending-registration-resend-failed";
    console.log("[AuthDebug] pendingRegistrationApi:resend:error-response", {
      url: `${REGISTRATION_API_BASE_URL}/registrationResend`,
      status: errorDetails.status,
      code,
      message: errorDetails.message,
      contentType: errorDetails.contentType,
      body: errorDetails.body,
    });
    throw createApiError(code, errorDetails);
  }
};

export const finalizePendingRegistrationRequest = async (params: {
  idToken: string;
}) => {
  const response = await fetch(`${REGISTRATION_API_BASE_URL}/registrationFinalize`, {
    method: "POST",
    headers: buildHeaders(params.idToken),
  });

  if (!response.ok) {
    const errorDetails = await parseErrorResponse(response);
    const code = errorDetails.code ?? "pending-registration-finalize-failed";
    console.log("[AuthDebug] pendingRegistrationApi:finalize:error-response", {
      url: `${REGISTRATION_API_BASE_URL}/registrationFinalize`,
      status: errorDetails.status,
      code,
      message: errorDetails.message,
      contentType: errorDetails.contentType,
      body: errorDetails.body,
    });
    throw createApiError(code, errorDetails);
  }

  return (await response.json()) as { email: string };
};
