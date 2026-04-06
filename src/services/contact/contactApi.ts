const CONTACT_API_BASE_URL = "https://europe-west1-mytracker-0.cloudfunctions.net";

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

type ContactCategory = "suggestion" | "bug" | "question" | "other";

export const submitContactRequest = async (params: {
  idToken?: string | null;
  category: ContactCategory;
  subject: string;
  message: string;
  email: string;
  appVersion: string;
  platform: string;
  language: "de" | "en";
  theme: "Dark" | "Light";
  userStatus: "linked" | "anonymous" | "signed-out";
  userId: string | null;
  occurredAt: string;
}) => {
  console.log("[ContactDebug] contactApi:submit:request", {
    url: `${CONTACT_API_BASE_URL}/contactSubmit`,
    category: params.category,
    subjectLength: params.subject.length,
    messageLength: params.message.length,
    platform: params.platform,
    language: params.language,
    theme: params.theme,
    userStatus: params.userStatus,
    hasIdToken: Boolean(params.idToken),
  });

  const response = await fetch(`${CONTACT_API_BASE_URL}/contactSubmit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(params.idToken ? { Authorization: `Bearer ${params.idToken}` } : {}),
    },
    body: JSON.stringify({
      category: params.category,
      subject: params.subject,
      message: params.message,
      email: params.email,
      appVersion: params.appVersion,
      platform: params.platform,
      language: params.language,
      theme: params.theme,
      userStatus: params.userStatus,
      userId: params.userId,
      occurredAt: params.occurredAt,
    }),
  });

  if (!response.ok) {
    const errorDetails = await parseErrorResponse(response);
    const code = errorDetails.code ?? "contact-submit-failed";
    console.log("[ContactDebug] contactApi:submit:error-response", {
      status: errorDetails.status,
      code,
      message: errorDetails.message,
      contentType: errorDetails.contentType,
      body: errorDetails.body,
    });
    throw createApiError(code, errorDetails);
  }

  console.log("[ContactDebug] contactApi:submit:success-response", {
    url: `${CONTACT_API_BASE_URL}/contactSubmit`,
  });
};
