const REGISTRATION_API_BASE_URL = "https://europe-west1-mytracker-0.cloudfunctions.net";

const buildHeaders = (idToken: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${idToken}`,
});

const parseErrorCode = async (response: Response) => {
  try {
    const payload = (await response.json()) as { error?: { code?: string } };
    return payload.error?.code ?? null;
  } catch {
    return null;
  }
};

const createApiError = (code: string) => {
  const error = new Error(code);
  (error as Error & { code?: string }).code = code;
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
    const code = (await parseErrorCode(response)) ?? "pending-registration-start-failed";
    throw createApiError(code);
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
    const code = (await parseErrorCode(response)) ?? "pending-registration-resend-failed";
    throw createApiError(code);
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
    const code = (await parseErrorCode(response)) ?? "pending-registration-finalize-failed";
    throw createApiError(code);
  }

  return (await response.json()) as { email: string };
};
