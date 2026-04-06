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
  console.log("[AuthDebug] pendingRegistrationApi:start:request", {
    url: `${REGISTRATION_API_BASE_URL}/registrationStart`,
    method: "POST",
    email: params.email,
  });
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

  const body = (await response.json()) as { flowVersion?: string } | null;
  console.log("[AuthDebug] pendingRegistrationApi:start:success-response", {
    url: `${REGISTRATION_API_BASE_URL}/registrationStart`,
    flowVersion: body?.flowVersion ?? null,
  });
};

export const resendPendingRegistrationRequest = async (params: {
  idToken: string;
}) => {
  console.log("[AuthDebug] pendingRegistrationApi:resend:request", {
    url: `${REGISTRATION_API_BASE_URL}/registrationResend`,
    method: "POST",
  });
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

  const body = (await response.json()) as { flowVersion?: string } | null;
  console.log("[AuthDebug] pendingRegistrationApi:resend:success-response", {
    url: `${REGISTRATION_API_BASE_URL}/registrationResend`,
    flowVersion: body?.flowVersion ?? null,
  });
};

export const cancelPendingRegistrationRequest = async (params: {
  idToken: string;
}) => {
  console.log("[AuthDebug] pendingRegistrationApi:cancel:request", {
    url: `${REGISTRATION_API_BASE_URL}/registrationCancel`,
    method: "POST",
  });
  const response = await fetch(`${REGISTRATION_API_BASE_URL}/registrationCancel`, {
    method: "POST",
    headers: buildHeaders(params.idToken),
  });

  if (!response.ok) {
    const errorDetails = await parseErrorResponse(response);
    const code = errorDetails.code ?? "pending-registration-cancel-failed";
    console.log("[AuthDebug] pendingRegistrationApi:cancel:error-response", {
      url: `${REGISTRATION_API_BASE_URL}/registrationCancel`,
      status: errorDetails.status,
      code,
      message: errorDetails.message,
      contentType: errorDetails.contentType,
      body: errorDetails.body,
    });
    throw createApiError(code, errorDetails);
  }
};

export const confirmPendingRegistrationRequest = async (params: {
  idToken: string;
  token: string;
}) => {
  console.log("[AuthDebug] pendingRegistrationApi:confirm:request", {
    url: `${REGISTRATION_API_BASE_URL}/registrationConfirmApp`,
    method: "POST",
    hasToken: params.token.trim().length > 0,
  });
  const response = await fetch(`${REGISTRATION_API_BASE_URL}/registrationConfirmApp`, {
    method: "POST",
    headers: buildHeaders(params.idToken),
    body: JSON.stringify({
      token: params.token,
    }),
  });

  if (!response.ok) {
    const errorDetails = await parseErrorResponse(response);
    const code = errorDetails.code ?? "pending-registration-confirm-failed";
    console.log("[AuthDebug] pendingRegistrationApi:confirm:error-response", {
      url: `${REGISTRATION_API_BASE_URL}/registrationConfirmApp`,
      status: errorDetails.status,
      code,
      message: errorDetails.message,
      contentType: errorDetails.contentType,
      body: errorDetails.body,
    });
    throw createApiError(code, errorDetails);
  }

  const body = (await response.json()) as {
    email: string;
    status: "confirmed";
    flowVersion?: string;
  };
  console.log("[AuthDebug] pendingRegistrationApi:confirm:success-response", {
    url: `${REGISTRATION_API_BASE_URL}/registrationConfirmApp`,
    flowVersion: body.flowVersion ?? null,
    status: body.status,
    email: body.email,
  });
  return body;
};

export const finalizePendingRegistrationRequest = async (params: {
  idToken: string;
}) => {
  console.log("[AuthDebug] pendingRegistrationApi:finalize:request", {
    url: `${REGISTRATION_API_BASE_URL}/registrationFinalize`,
    method: "POST",
  });
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

  const body = (await response.json()) as { email: string; flowVersion?: string };
  console.log("[AuthDebug] pendingRegistrationApi:finalize:success-response", {
    url: `${REGISTRATION_API_BASE_URL}/registrationFinalize`,
    flowVersion: body.flowVersion ?? null,
    email: body.email,
  });
  return body;
};

export const accountMailEventRequest = async (params: {
  idToken: string;
  eventType: "account-linked" | "password-changed";
  idempotencyKey: string;
  source: string;
  occurredAt?: string;
}) => {
  console.log("[AuthDebug] pendingRegistrationApi:account-mail-event:request", {
    url: `${REGISTRATION_API_BASE_URL}/accountMailEvent`,
    method: "POST",
    eventType: params.eventType,
    source: params.source,
    idempotencyKey: params.idempotencyKey,
  });

  const response = await fetch(`${REGISTRATION_API_BASE_URL}/accountMailEvent`, {
    method: "POST",
    headers: buildHeaders(params.idToken),
    body: JSON.stringify({
      eventType: params.eventType,
      idempotencyKey: params.idempotencyKey,
      source: params.source,
      occurredAt: params.occurredAt ?? null,
    }),
  });

  if (!response.ok) {
    const errorDetails = await parseErrorResponse(response);
    const code = errorDetails.code ?? "account-mail-event-failed";
    console.log("[AuthDebug] pendingRegistrationApi:account-mail-event:error-response", {
      url: `${REGISTRATION_API_BASE_URL}/accountMailEvent`,
      status: errorDetails.status,
      code,
      message: errorDetails.message,
      contentType: errorDetails.contentType,
      body: errorDetails.body,
      eventType: params.eventType,
    });
    throw createApiError(code, errorDetails);
  }

  console.log("[AuthDebug] pendingRegistrationApi:account-mail-event:success-response", {
    url: `${REGISTRATION_API_BASE_URL}/accountMailEvent`,
    eventType: params.eventType,
  });
};
