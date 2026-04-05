const crypto = require("node:crypto");

const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const { onRequest } = require("firebase-functions/v2/https");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

const REGION = "europe-west1";
const TOKEN_TTL_MS = 72 * 60 * 60 * 1000;
const REGISTRATION_COLLECTION = "registrationConfirmations";
const REGISTRATION_EMAIL_RESERVATIONS_COLLECTION = "registrationEmailReservations";
const REGISTRATION_FLOW_VERSION = "pending-registration-v3-app-confirm-only";
const PUBLIC_HTTP_OPTIONS = { region: REGION, invoker: "public" };
const DEFAULT_CONFIRMATION_URL =
  "https://europe-west1-mytracker-0.cloudfunctions.net/registrationConfirm";
const DEFAULT_APP_CONFIRM_DEEP_LINK_URL = "octovault://confirm-email";

const setCors = (response) => {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
};

const jsonError = (response, status, code, message) => {
  response.status(status).json({
    error: {
      code,
      message,
    },
  });
};

const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const hashEmail = (email) => crypto.createHash("sha256").update(normalizeEmail(email)).digest("hex");
const shortenHash = (value) => String(value ?? "").slice(0, 12);
const logRegistrationEvent = (event, payload = {}) => {
  logger.info(event, payload);
};

const buildPendingRegistrationState = (email, now, status = "pending") => ({
  status,
  pendingEmail: email,
  startedAt: now.toISOString(),
  expiresAt: new Date(now.getTime() + TOKEN_TTL_MS).toISOString(),
  lastRequestedAt: now.toISOString(),
});

const buildReservationState = ({
  email,
  uid,
  tokenHash,
  now,
  status = "pending",
  confirmedAt,
}) => ({
  email,
  uid,
  status,
  currentTokenHash: tokenHash,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  expiresAt: admin.firestore.Timestamp.fromDate(new Date(now.getTime() + TOKEN_TTL_MS)),
  ...(confirmedAt ? { confirmedAt } : {}),
});

const getBearerToken = (request) => {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
};

const verifyAnonymousCaller = async (request) => {
  const idToken = getBearerToken(request);
  if (!idToken) {
    const error = new Error("Missing bearer token.");
    error.code = "missing-auth-token";
    throw error;
  }

  const decodedToken = await auth.verifyIdToken(idToken);
  if (decodedToken.firebase?.sign_in_provider !== "anonymous") {
    const error = new Error("Pending registration requires an anonymous user.");
    error.code = "registration-requires-anonymous-user";
    throw error;
  }

  return decodedToken;
};

const getRegistrationConfig = () => ({
  confirmationBaseUrl:
    process.env.REGISTRATION_CONFIRMATION_URL || DEFAULT_CONFIRMATION_URL,
  appConfirmationDeepLinkUrl:
    process.env.REGISTRATION_APP_CONFIRMATION_DEEP_LINK_URL || DEFAULT_APP_CONFIRM_DEEP_LINK_URL,
  resendApiKey: process.env.RESEND_API_KEY,
  registrationMailFrom: process.env.REGISTRATION_MAIL_FROM,
});

const buildDeepLinkUrl = (baseUrl, token) =>
  `${baseUrl}${String(baseUrl).includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;

const ensureEmailUnused = async (email) => {
  try {
    await auth.getUserByEmail(email);
    const error = new Error("Email already in use.");
    error.code = "auth/email-already-in-use";
    throw error;
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return;
    }

    throw error;
  }
};

const getReservationRef = (email) =>
  db.collection(REGISTRATION_EMAIL_RESERVATIONS_COLLECTION).doc(hashEmail(email));

const isReservationExpired = (reservation) => {
  const expiresAt = reservation?.expiresAt?.toDate?.();

  return !(expiresAt instanceof Date) || expiresAt.getTime() <= Date.now();
};

const resolveReservationStatus = (reservation) => {
  if (!reservation) {
    return null;
  }

  if (reservation.status === "expired" || isReservationExpired(reservation)) {
    return "expired";
  }

  return reservation.status ?? null;
};

const releasePreviousReservationIfNeeded = async ({ userId, pendingRegistration, nextEmail }) => {
  const previousEmail = normalizeEmail(pendingRegistration?.pendingEmail);

  if (!previousEmail || previousEmail === nextEmail) {
    return;
  }

  const reservationRef = getReservationRef(previousEmail);
  const reservationSnapshot = await reservationRef.get();

  if (!reservationSnapshot.exists) {
    return;
  }

  const reservation = reservationSnapshot.data();
  if (reservation?.uid !== userId) {
    return;
  }

  if (!["pending", "confirmed"].includes(String(reservation.status))) {
    return;
  }

  await reservationRef.set(
    {
      status: "cancelled",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
};

const sendConfirmationEmail = async ({ email, confirmationUrl }) => {
  const { resendApiKey, registrationMailFrom, confirmationBaseUrl } = getRegistrationConfig();

  if (!resendApiKey || !registrationMailFrom) {
    logger.error("registration:mail-config-missing", {
      hasResendApiKey: Boolean(resendApiKey),
      hasRegistrationMailFrom: Boolean(registrationMailFrom),
      confirmationBaseUrl,
    });
    const error = new Error("Mail transport is not configured.");
    error.code = "registration-mail-not-configured";
    throw error;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: registrationMailFrom,
      to: email,
      subject: "Bitte best\u00e4tige deine E-Mail",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <p>Bitte best\u00e4tige deine E-Mail innerhalb von 72 Stunden.</p>
          <p style="margin:24px 0">
            <a href="${confirmationUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#15803D;color:#ffffff;text-decoration:none;font-weight:600">
              OctoVault \u00f6ffnen
            </a>
          </p>
          <p>Der Link \u00f6ffnet OctoVault. Erst in der App best\u00e4tigst du die E-Mail und vergibst dein Passwort.</p>
          <p style="margin-top:16px;font-size:13px;color:#6b7280">Falls der Button nicht reagiert, \u00f6ffne dieselbe Mail auf dem Ger\u00e4t im Browser und tippe den Link dort erneut an.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error("registration:send-email-failed", {
      email,
      status: response.status,
      body,
    });
    const error = new Error("Failed to send confirmation email.");
    error.code = "registration-mail-send-failed";
    throw error;
  }
};

const renderHtml = (title, message, content = "") => `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { margin:0; font-family:Arial,sans-serif; background:#eff2f5; color:#111827; }
      main { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
      section { width:100%; max-width:460px; background:#ffffff; border:1px solid #dce4ef; border-radius:24px; padding:28px; box-shadow:0 12px 32px rgba(15,23,42,0.08); }
      h1 { margin:0 0 12px; font-size:24px; line-height:1.25; }
      p { margin:0; color:#5f6877; line-height:1.6; }
      .actions { margin-top:24px; display:flex; justify-content:flex-start; }
      button { appearance:none; border:0; border-radius:999px; padding:12px 18px; background:#15803D; color:#ffffff; font-weight:600; cursor:pointer; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>${title}</h1>
        <p>${message}</p>
        ${content}
      </section>
    </main>
  </body>
</html>`;

const registrationStartHandler = async (request, response) => {
  logRegistrationEvent("registrationStart:request", {
    method: request.method,
    hasAuthorization: Boolean(request.headers.authorization),
    userAgent: request.headers["user-agent"] ?? null,
    flowVersion: REGISTRATION_FLOW_VERSION,
  });
  setCors(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    jsonError(response, 405, "method-not-allowed", "Only POST is allowed.");
    return;
  }

  try {
    const decodedToken = await verifyAnonymousCaller(request);
    const email = normalizeEmail(request.body?.email);
    const { confirmationBaseUrl } = getRegistrationConfig();

    if (!validateEmail(email)) {
      jsonError(response, 400, "invalid-email", "Email is invalid.");
      return;
    }

    await ensureEmailUnused(email);

    const now = new Date();
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const emailHash = hashEmail(email);
    const confirmationUrl = `${confirmationBaseUrl}?token=${encodeURIComponent(token)}`;
    const pendingRegistration = buildPendingRegistrationState(email, now, "pending");
    const userRef = db.collection("users").doc(decodedToken.uid);
    const reservationRef = db.collection(REGISTRATION_EMAIL_RESERVATIONS_COLLECTION).doc(emailHash);
    const [userSnapshot, reservationSnapshot] = await Promise.all([userRef.get(), reservationRef.get()]);
    const existingReservation = reservationSnapshot.data();
    const existingReservationStatus = resolveReservationStatus(existingReservation);

    if (
      existingReservation &&
      ["pending", "confirmed"].includes(String(existingReservationStatus)) &&
      existingReservation.uid !== decodedToken.uid
    ) {
      jsonError(response, 409, "registration-email-reserved", "Email is already reserved.");
      return;
    }

    const currentPendingRegistration = userSnapshot.data()?.pendingRegistration;
    const currentPendingEmail = normalizeEmail(currentPendingRegistration?.pendingEmail);

    logRegistrationEvent("registrationStart:state-before-write", {
      uid: decodedToken.uid,
      email,
      reservationStatus: existingReservationStatus,
      currentPendingStatus: currentPendingRegistration?.status ?? null,
      currentPendingEmail,
      nextTokenHash: shortenHash(tokenHash),
    });

    if (
      existingReservation &&
      existingReservation.uid === decodedToken.uid &&
      existingReservationStatus === "pending" &&
      currentPendingRegistration?.status === "pending" &&
      currentPendingEmail === email
    ) {
      jsonError(response, 409, "registration-already-pending", "Registration is already pending.");
      return;
    }

    if (
      existingReservation &&
      existingReservation.uid === decodedToken.uid &&
      existingReservationStatus === "confirmed" &&
      currentPendingRegistration?.status === "confirmed" &&
      currentPendingEmail === email
    ) {
      jsonError(
        response,
        409,
        "registration-already-confirmed",
        "Registration was already confirmed.",
      );
      return;
    }

    await releasePreviousReservationIfNeeded({
      userId: decodedToken.uid,
      pendingRegistration: userSnapshot.data()?.pendingRegistration,
      nextEmail: email,
    });

    await db.collection(REGISTRATION_COLLECTION).doc(tokenHash).set({
      uid: decodedToken.uid,
      email,
      emailHash,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(now.getTime() + TOKEN_TTL_MS)),
    });

    await userRef.set(
      {
        pendingRegistration,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await reservationRef.set(
      buildReservationState({
        email,
        uid: decodedToken.uid,
        tokenHash,
        now,
      }),
      { merge: true },
    );

    logRegistrationEvent("registrationStart:pending-written", {
      uid: decodedToken.uid,
      email,
      nextStatus: pendingRegistration.status,
      tokenHash: shortenHash(tokenHash),
    });

    try {
      await sendConfirmationEmail({ email, confirmationUrl });
    } catch (error) {
      await userRef.set(
        {
          pendingRegistration: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      await db.collection(REGISTRATION_COLLECTION).doc(tokenHash).delete();
      await reservationRef.delete();
      throw error;
    }

    response.status(200).json({ ok: true, flowVersion: REGISTRATION_FLOW_VERSION });
  } catch (error) {
    logger.error("registrationStart", {
      code: error.code || "registration-start-failed",
      message: error.message || "Registration start failed.",
      stack: error.stack || null,
    });
    const code = error.code || "registration-start-failed";
    const status =
      code === "auth/email-already-in-use"
        ? 409
        : code === "registration-email-reserved" ||
            code === "registration-already-pending" ||
            code === "registration-already-confirmed"
          ? 409
          : code === "invalid-email" || code === "missing-auth-token"
            ? 400
            : code === "registration-requires-anonymous-user"
              ? 403
              : 500;
    jsonError(response, status, code, error.message || "Registration start failed.");
  }
};

const registrationResendHandler = async (request, response) => {
  logRegistrationEvent("registrationResend:request", {
    method: request.method,
    hasAuthorization: Boolean(request.headers.authorization),
    userAgent: request.headers["user-agent"] ?? null,
    flowVersion: REGISTRATION_FLOW_VERSION,
  });
  setCors(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    jsonError(response, 405, "method-not-allowed", "Only POST is allowed.");
    return;
  }

  try {
    const decodedToken = await verifyAnonymousCaller(request);
    const { confirmationBaseUrl } = getRegistrationConfig();
    const userRef = db.collection("users").doc(decodedToken.uid);
    const userSnapshot = await userRef.get();
    const pendingRegistration = userSnapshot.data()?.pendingRegistration;

    if (!pendingRegistration) {
      jsonError(response, 409, "registration-not-pending", "No pending registration found.");
      return;
    }

    if (pendingRegistration.status === "confirmed") {
      jsonError(
        response,
        409,
        "registration-already-confirmed",
        "Registration was already confirmed.",
      );
      return;
    }

    if (pendingRegistration.status === "cancelled") {
      jsonError(
        response,
        409,
        "registration-cancelled",
        "Registration was already cancelled.",
      );
      return;
    }

    if (
      pendingRegistration.status === "expired" ||
      new Date(pendingRegistration.expiresAt).getTime() <= Date.now()
    ) {
      await userRef.set(
        {
          pendingRegistration: {
            ...pendingRegistration,
            status: "expired",
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      jsonError(
        response,
        410,
        "pending-registration-expired",
        "Pending registration expired.",
      );
      return;
    }

    if (pendingRegistration.status !== "pending") {
      jsonError(response, 409, "registration-not-pending", "No pending registration found.");
      return;
    }

    const email = normalizeEmail(pendingRegistration.pendingEmail);
    const now = new Date();
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const emailHash = hashEmail(email);
    const confirmationUrl = `${confirmationBaseUrl}?token=${encodeURIComponent(token)}`;
    const reservationRef = getReservationRef(email);
    const reservationSnapshot = await reservationRef.get();
    const reservation = reservationSnapshot.data();
    const reservationStatus = resolveReservationStatus(reservation);
    const nextPendingRegistration = {
      ...pendingRegistration,
      status: "pending",
      expiresAt: new Date(now.getTime() + TOKEN_TTL_MS).toISOString(),
      lastRequestedAt: now.toISOString(),
    };

    logRegistrationEvent("registrationResend:state-before-write", {
      uid: decodedToken.uid,
      email,
      pendingStatus: pendingRegistration.status,
      reservationStatus,
      nextTokenHash: shortenHash(tokenHash),
      reservationCurrentTokenHash: shortenHash(reservation?.currentTokenHash),
    });

    await ensureEmailUnused(email);

    if (!reservation || reservation.uid !== decodedToken.uid) {
      jsonError(response, 409, "registration-not-pending", "No pending registration found.");
      return;
    }

    if (reservationStatus === "confirmed") {
      jsonError(
        response,
        409,
        "registration-already-confirmed",
        "Registration was already confirmed.",
      );
      return;
    }

    if (reservationStatus !== "pending") {
      jsonError(response, 409, "registration-not-pending", "No pending registration found.");
      return;
    }

    await db.collection(REGISTRATION_COLLECTION).doc(tokenHash).set({
      uid: decodedToken.uid,
      email,
      emailHash,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(now.getTime() + TOKEN_TTL_MS)),
    });

    await userRef.set(
      {
        pendingRegistration: nextPendingRegistration,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await reservationRef.set(
      {
        status: "pending",
        currentTokenHash: tokenHash,
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(now.getTime() + TOKEN_TTL_MS)),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    logRegistrationEvent("registrationResend:pending-written", {
      uid: decodedToken.uid,
      email,
      nextStatus: nextPendingRegistration.status,
      tokenHash: shortenHash(tokenHash),
    });

    try {
      await sendConfirmationEmail({ email, confirmationUrl });
    } catch (error) {
      await db.collection(REGISTRATION_COLLECTION).doc(tokenHash).delete();
      throw error;
    }

    response.status(200).json({ ok: true, flowVersion: REGISTRATION_FLOW_VERSION });
  } catch (error) {
    logger.error("registrationResend", {
      code: error.code || "registration-resend-failed",
      message: error.message || "Registration resend failed.",
      stack: error.stack || null,
    });
    const code = error.code || "registration-resend-failed";
    const status =
      code === "auth/email-already-in-use"
        ? 409
        : code === "registration-not-pending" ||
            code === "registration-already-confirmed" ||
            code === "registration-cancelled"
          ? 409
          : code === "pending-registration-expired"
            ? 410
            : code === "missing-auth-token"
              ? 400
              : code === "registration-requires-anonymous-user"
                ? 403
                : 500;
    jsonError(response, status, code, error.message || "Registration resend failed.");
  }
};

const registrationCancelHandler = async (request, response) => {
  logRegistrationEvent("registrationCancel:request", {
    method: request.method,
    hasAuthorization: Boolean(request.headers.authorization),
    userAgent: request.headers["user-agent"] ?? null,
  });
  setCors(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    jsonError(response, 405, "method-not-allowed", "Only POST is allowed.");
    return;
  }

  try {
    const decodedToken = await verifyAnonymousCaller(request);
    const userRef = db.collection("users").doc(decodedToken.uid);
    const userSnapshot = await userRef.get();
    const pendingRegistration = userSnapshot.data()?.pendingRegistration;

    if (!pendingRegistration) {
      response.status(200).json({ ok: true });
      return;
    }

    const email = normalizeEmail(pendingRegistration.pendingEmail);
    const reservationRef = getReservationRef(email);
    const reservationSnapshot = await reservationRef.get();
    const reservation = reservationSnapshot.data();

    await userRef.set(
      {
        pendingRegistration: {
          ...pendingRegistration,
          status: "cancelled",
          cancelledAt: new Date().toISOString(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    logRegistrationEvent("registrationCancel:pending-written", {
      uid: decodedToken.uid,
      email,
      nextStatus: "cancelled",
    });

    if (reservation && reservation.uid === decodedToken.uid) {
      await reservationRef.set(
        {
          status: "cancelled",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    response.status(200).json({ ok: true });
  } catch (error) {
    logger.error("registrationCancel", {
      code: error.code || "registration-cancel-failed",
      message: error.message || "Registration cancel failed.",
      stack: error.stack || null,
    });
    const code = error.code || "registration-cancel-failed";
    const status =
      code === "missing-auth-token"
        ? 400
        : code === "registration-requires-anonymous-user"
          ? 403
          : 500;
    jsonError(response, status, code, error.message || "Registration cancel failed.");
  }
};

const registrationConfirmHandler = async (request, response) => {
  const token = String(request.query.token ?? "");
  if (!token) {
    response.status(400).send(renderHtml("Link ung\u00fcltig", "Der Best\u00e4tigungslink ist unvollst\u00e4ndig."));
    return;
  }

  const tokenHash = hashToken(token);
  logRegistrationEvent("registrationConfirm:request", {
    method: request.method,
    tokenHash: shortenHash(tokenHash),
    userAgent: request.headers["user-agent"] ?? null,
    hasCookie: Boolean(request.headers.cookie),
    queryKeys: Object.keys(request.query ?? {}),
  });
  const tokenRef = db.collection(REGISTRATION_COLLECTION).doc(tokenHash);
  const tokenSnapshot = await tokenRef.get();

  if (!tokenSnapshot.exists) {
    response.status(410).send(renderHtml("Link abgelaufen", "Dieser Best\u00e4tigungslink ist nicht mehr g\u00fcltig."));
    return;
  }

  const tokenData = tokenSnapshot.data();
  const expiresAt = tokenData?.expiresAt?.toDate?.();
  const usedAt = tokenData?.usedAt?.toDate?.();
  const { appConfirmationDeepLinkUrl } = getRegistrationConfig();
  const openAppUrl = buildDeepLinkUrl(appConfirmationDeepLinkUrl, token);

  if (!(expiresAt instanceof Date) || expiresAt.getTime() <= Date.now()) {
    response.status(410).send(renderHtml("Link abgelaufen", "Dieser Best\u00e4tigungslink ist nicht mehr g\u00fcltig."));
    return;
  }

  if (request.method === "GET") {
  logRegistrationEvent("registrationConfirm:get-rendered-no-confirm", {
      tokenHash: shortenHash(tokenHash),
      alreadyConfirmed: Boolean(usedAt),
      openAppUrl,
      note: "GET renders buttons only and never writes confirmed.",
      flowVersion: REGISTRATION_FLOW_VERSION,
    });

      response.status(200).send(
        renderHtml(
          usedAt ? "OctoVault erneut \u00f6ffnen" : "OctoVault \u00f6ffnen",
          usedAt
            ? "Die E-Mail wurde bereits in der App verarbeitet. Du kannst OctoVault jetzt erneut \u00f6ffnen."
            : "Dieser Link best\u00e4tigt noch nichts. \u00d6ffne OctoVault per Button oder best\u00e4tige bewusst hier im Browser und mache danach in der App weiter.",
          `<div class="actions">
            <a href="${openAppUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#15803D;color:#ffffff;text-decoration:none;font-weight:600">
              OctoVault \u00f6ffnen
            </a>
            ${
              usedAt
                ? ""
                : `<form method="post" action="?token=${encodeURIComponent(token)}" style="display:inline">
                     <button type="submit" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#eef3f9;color:#111827;text-decoration:none;font-weight:600;border:1px solid #dce4ef;cursor:pointer">
                       Im Browser bestätigen
                     </button>
                   </form>`
            }
          </div>`,
      ),
    );
    return;
  }

  if (request.method === "HEAD") {
    response.status(200).send("");
    return;
  }

  if (request.method === "POST") {
  logRegistrationEvent("registrationConfirm:browser-confirm-blocked", {
      tokenHash: shortenHash(tokenHash),
      alreadyConfirmed: Boolean(usedAt),
      note: "Browser confirmation is disabled. App confirmation is required.",
      flowVersion: REGISTRATION_FLOW_VERSION,
    });
    response.status(405).send(
      renderHtml(
        "Bestätigung nur in der App",
        "Die E-Mail-Bestätigung wird nur noch direkt in OctoVault abgeschlossen. Öffne die App auf dem Gerät, auf dem du die Registrierung gestartet hast.",
        `<div class="actions">
          <a href="${openAppUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#15803D;color:#ffffff;text-decoration:none;font-weight:600">
            OctoVault öffnen
          </a>
        </div>`,
      ),
    );
    return;
  }

  if (request.method !== "POST") {
    logRegistrationEvent("registrationConfirm:non-supported-request", {
      tokenHash: shortenHash(tokenHash),
      method: request.method,
    });
    response.status(405).send(
      renderHtml(
        "Nur in der App bestätigen",
        "Dieser Link unterstützt nur das Öffnen von OctoVault oder eine bewusste Bestätigung im Browser.",
        `<div class="actions">
          <a href="${openAppUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#15803D;color:#ffffff;text-decoration:none;font-weight:600">
            OctoVault öffnen
          </a>
        </div>`,
      ),
    );
    return;
  }

  logRegistrationEvent("registrationConfirm:browser-confirm:start", {
    tokenHash: shortenHash(tokenHash),
    alreadyConfirmed: Boolean(usedAt),
    trigger: "explicit-browser-post",
  });

  if (usedAt) {
    response.status(200).send(
      renderHtml(
        "E-Mail bereits bestätigt",
        "Diese E-Mail wurde bereits bestätigt. Du kannst jetzt zur App zurückkehren und dein Passwort festlegen.",
        `<div class="actions">
          <a href="${openAppUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#15803D;color:#ffffff;text-decoration:none;font-weight:600">
            OctoVault öffnen
          </a>
        </div>`,
      ),
    );
    return;
  }

  try {
    const email = normalizeEmail(tokenData.email);
    const emailHash = tokenData.emailHash || hashEmail(email);
    const userRef = db.collection("users").doc(String(tokenData.uid));
    const reservationRef = db.collection(REGISTRATION_EMAIL_RESERVATIONS_COLLECTION).doc(String(emailHash));
    const [userSnapshot, reservationSnapshot] = await Promise.all([userRef.get(), reservationRef.get()]);
    const pendingRegistration = userSnapshot.data()?.pendingRegistration;
    const reservation = reservationSnapshot.data();

    if (!pendingRegistration || normalizeEmail(pendingRegistration.pendingEmail) !== email) {
      response.status(409).send(
        renderHtml(
          "Bestätigung nicht möglich",
          "Dieser Vorgang ist nicht mehr offen.",
          `<div class="actions">
            <a href="${openAppUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#15803D;color:#ffffff;text-decoration:none;font-weight:600">
              OctoVault öffnen
            </a>
          </div>`,
        ),
      );
      return;
    }

    if (new Date(pendingRegistration.expiresAt).getTime() <= Date.now()) {
      await userRef.set(
        {
          pendingRegistration: {
            ...pendingRegistration,
            status: "expired",
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      await reservationRef.set(
        {
          status: "expired",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      response.status(410).send(
        renderHtml(
          "Bestätigung abgelaufen",
          "Die Registrierung ist abgelaufen. Bitte starte sie erneut in der App.",
          `<div class="actions">
            <a href="${openAppUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#15803D;color:#ffffff;text-decoration:none;font-weight:600">
              OctoVault öffnen
            </a>
          </div>`,
        ),
      );
      return;
    }

    if (
      !reservation ||
      reservation.uid !== tokenData.uid ||
      normalizeEmail(reservation.email) !== email ||
      reservation.currentTokenHash !== tokenHash
    ) {
      response.status(409).send(
        renderHtml(
          "Bestätigung nicht möglich",
          "Dieser Link wurde durch einen neueren Link ersetzt oder gehört nicht mehr zum aktuellen Vorgang.",
          `<div class="actions">
            <a href="${openAppUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#15803D;color:#ffffff;text-decoration:none;font-weight:600">
              OctoVault öffnen
            </a>
          </div>`,
        ),
      );
      return;
    }

    if (
      pendingRegistration.status === "confirmed" &&
      reservation.status === "confirmed" &&
      tokenData?.status === "confirmed"
    ) {
      response.status(200).send(
        renderHtml(
          "E-Mail bereits bestätigt",
          "Diese E-Mail wurde bereits bestätigt. Du kannst jetzt zur App zurückkehren und dein Passwort festlegen.",
          `<div class="actions">
            <a href="${openAppUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#15803D;color:#ffffff;text-decoration:none;font-weight:600">
              OctoVault öffnen
            </a>
          </div>`,
        ),
      );
      return;
    }

    if (pendingRegistration.status !== "pending" || reservation.status !== "pending" || tokenData?.status !== "pending") {
      response.status(409).send(
        renderHtml(
          "Bestätigung nicht möglich",
          "Dieser Vorgang ist nicht mehr offen.",
          `<div class="actions">
            <a href="${openAppUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#15803D;color:#ffffff;text-decoration:none;font-weight:600">
              OctoVault öffnen
            </a>
          </div>`,
        ),
      );
      return;
    }

    logRegistrationEvent("registrationConfirm:browser-confirm:confirmed-write", {
      tokenHash: shortenHash(tokenHash),
      uid: tokenData.uid,
      email,
      trigger: "explicit-browser-post",
    });

    await db.runTransaction(async (transaction) => {
      transaction.set(
        userRef,
        {
          pendingRegistration: {
            ...pendingRegistration,
            status: "confirmed",
            confirmedAt: new Date().toISOString(),
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      transaction.set(
        reservationRef,
        {
          status: "confirmed",
          confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      transaction.set(
        tokenRef,
        {
          status: "confirmed",
          usedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    response.status(200).send(
      renderHtml(
        "E-Mail bestätigt",
        "Die E-Mail wurde bestätigt. Kehre jetzt in OctoVault zurück und lege dort dein Passwort fest.",
        `<div class="actions">
          <a href="${openAppUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#15803D;color:#ffffff;text-decoration:none;font-weight:600">
            OctoVault öffnen
          </a>
        </div>`,
      ),
    );
  } catch (error) {
    logger.error("registrationConfirmBrowser", {
      code: error.code || "registration-confirm-browser-failed",
      message: error.message || "Registration confirm browser failed.",
      stack: error.stack || null,
    });
    response.status(500).send(
      renderHtml(
        "Bestätigung fehlgeschlagen",
        "Die Bestätigung konnte gerade nicht abgeschlossen werden. Öffne die App oder versuche es später erneut.",
        `<div class="actions">
          <a href="${openAppUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#15803D;color:#ffffff;text-decoration:none;font-weight:600">
            OctoVault öffnen
          </a>
        </div>`,
      ),
    );
  }
  };

const registrationConfirmAppHandler = async (request, response) => {
  logRegistrationEvent("registrationConfirmApp:request", {
    method: request.method,
    hasAuthorization: Boolean(request.headers.authorization),
    userAgent: request.headers["user-agent"] ?? null,
    hasToken: typeof request.body?.token === "string" && request.body.token.trim().length > 0,
    note: "App confirm must only be called after explicit in-app button tap.",
    flowVersion: REGISTRATION_FLOW_VERSION,
  });
  setCors(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    jsonError(response, 405, "method-not-allowed", "Only POST is allowed.");
    return;
  }

  try {
    const decodedToken = await verifyAnonymousCaller(request);
    const token = String(request.body?.token ?? "").trim();

    if (!token) {
      jsonError(response, 400, "invalid-registration-token", "Registration token is invalid.");
      return;
    }

    const tokenHash = hashToken(token);
    const tokenRef = db.collection(REGISTRATION_COLLECTION).doc(tokenHash);
    const tokenSnapshot = await tokenRef.get();

    if (!tokenSnapshot.exists) {
      jsonError(response, 410, "invalid-registration-token", "Registration token is invalid.");
      return;
    }

    const tokenData = tokenSnapshot.data();
    const expiresAt = tokenData?.expiresAt?.toDate?.();

    if (!(expiresAt instanceof Date) || expiresAt.getTime() <= Date.now()) {
      jsonError(response, 410, "pending-registration-expired", "Pending registration expired.");
      return;
    }

    if (tokenData?.uid !== decodedToken.uid) {
      logRegistrationEvent("registrationConfirmApp:session-mismatch", {
        tokenHash: shortenHash(tokenHash),
        requestUid: decodedToken.uid,
        tokenUid: tokenData?.uid ?? null,
      });
      jsonError(
        response,
        409,
        "registration-session-mismatch",
        "This confirmation link belongs to a different anonymous session.",
      );
      return;
    }

    const email = normalizeEmail(tokenData.email);
    const emailHash = tokenData.emailHash || hashEmail(email);
    const userRef = db.collection("users").doc(decodedToken.uid);
    const reservationRef = db.collection(REGISTRATION_EMAIL_RESERVATIONS_COLLECTION).doc(String(emailHash));
    const [userSnapshot, reservationSnapshot] = await Promise.all([userRef.get(), reservationRef.get()]);
    const pendingRegistration = userSnapshot.data()?.pendingRegistration;
    const reservation = reservationSnapshot.data();

    logRegistrationEvent("registrationConfirmApp:state-before-write", {
      tokenHash: shortenHash(tokenHash),
      uid: decodedToken.uid,
      email,
      tokenStatus: tokenData?.status ?? null,
      pendingStatus: pendingRegistration?.status ?? null,
      reservationStatus: reservation?.status ?? null,
      reservationCurrentTokenHash: shortenHash(reservation?.currentTokenHash),
    });

    if (!pendingRegistration || normalizeEmail(pendingRegistration.pendingEmail) !== email) {
      jsonError(response, 409, "registration-not-pending", "No pending registration found.");
      return;
    }

    if (new Date(pendingRegistration.expiresAt).getTime() <= Date.now()) {
      await userRef.set(
        {
          pendingRegistration: {
            ...pendingRegistration,
            status: "expired",
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      await reservationRef.set(
        {
          status: "expired",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      jsonError(response, 410, "pending-registration-expired", "Pending registration expired.");
      return;
    }

    if (
      !reservation ||
      reservation.uid !== decodedToken.uid ||
      normalizeEmail(reservation.email) !== email ||
      reservation.currentTokenHash !== tokenHash
    ) {
      jsonError(
        response,
        409,
        "registration-token-mismatch",
        "This confirmation link is no longer active for the current registration.",
      );
      return;
    }

    if (
      pendingRegistration.status === "confirmed" &&
      reservation.status === "confirmed" &&
      tokenData?.status === "confirmed"
    ) {
      logRegistrationEvent("registrationConfirmApp:already-confirmed", {
        tokenHash: shortenHash(tokenHash),
        uid: decodedToken.uid,
        email,
      });
      response.status(200).json({ ok: true, email, status: "confirmed", flowVersion: REGISTRATION_FLOW_VERSION });
      return;
    }

    if (pendingRegistration.status !== "pending" || reservation.status !== "pending" || tokenData?.status !== "pending") {
      jsonError(response, 409, "registration-not-pending", "No pending registration found.");
      return;
    }

    logRegistrationEvent("registrationConfirmApp:confirmed-write", {
      tokenHash: shortenHash(tokenHash),
      uid: decodedToken.uid,
      email,
      trigger: "explicit-app-post",
    });

    await db.runTransaction(async (transaction) => {
      transaction.set(
        userRef,
        {
          pendingRegistration: {
            ...pendingRegistration,
            status: "confirmed",
            confirmedAt: new Date().toISOString(),
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      transaction.set(
        reservationRef,
        {
          status: "confirmed",
          confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      transaction.set(
        tokenRef,
        {
          status: "confirmed",
          usedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    logRegistrationEvent("registrationConfirmApp:confirmed", {
      tokenHash: shortenHash(tokenHash),
      uid: decodedToken.uid,
      email,
      nextStatus: "confirmed",
    });

    response.status(200).json({ ok: true, email, status: "confirmed", flowVersion: REGISTRATION_FLOW_VERSION });
  } catch (error) {
    logger.error("registrationConfirmApp", {
      code: error.code || "registration-confirm-app-failed",
      message: error.message || "Registration confirmation failed.",
      stack: error.stack || null,
    });
    const code = error.code || "registration-confirm-app-failed";
    const status =
      code === "missing-auth-token" || code === "invalid-registration-token"
        ? code === "invalid-registration-token"
          ? 410
          : 400
        : code === "registration-requires-anonymous-user"
          ? 403
          : code === "pending-registration-expired"
            ? 410
            : code === "registration-session-mismatch" ||
                code === "registration-token-mismatch" ||
                code === "registration-not-pending"
              ? 409
              : 500;
    jsonError(response, status, code, error.message || "Registration confirmation failed.");
  }
};

const registrationFinalizeHandler = async (request, response) => {
  logRegistrationEvent("registrationFinalize:request", {
    method: request.method,
    hasAuthorization: Boolean(request.headers.authorization),
    userAgent: request.headers["user-agent"] ?? null,
    flowVersion: REGISTRATION_FLOW_VERSION,
  });
  setCors(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    jsonError(response, 405, "method-not-allowed", "Only POST is allowed.");
    return;
  }

  try {
    const decodedToken = await verifyAnonymousCaller(request);
    const userSnapshot = await db.collection("users").doc(decodedToken.uid).get();
    const pendingRegistration = userSnapshot.data()?.pendingRegistration;

    if (!pendingRegistration) {
      jsonError(response, 409, "pending-registration-missing", "No pending registration found.");
      return;
    }

    if (pendingRegistration.status !== "confirmed") {
      jsonError(
        response,
        409,
        "pending-registration-not-confirmed",
        "Pending registration is not confirmed.",
      );
      return;
    }

    if (new Date(pendingRegistration.expiresAt).getTime() <= Date.now()) {
      await db.collection("users").doc(decodedToken.uid).set(
        {
          pendingRegistration: {
            ...pendingRegistration,
            status: "expired",
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      jsonError(response, 410, "pending-registration-expired", "Pending registration expired.");
      return;
    }

    const email = normalizeEmail(pendingRegistration.pendingEmail);
    const reservationRef = getReservationRef(email);
    const reservationSnapshot = await reservationRef.get();
    const reservation = reservationSnapshot.data();

    if (
      !reservation ||
      reservation.uid !== decodedToken.uid ||
      normalizeEmail(reservation.email) !== email ||
      reservation.status !== "confirmed"
    ) {
      jsonError(response, 409, "pending-registration-not-confirmed", "Pending registration is not confirmed.");
      return;
    }

    logRegistrationEvent("registrationFinalize:confirmed-state-verified", {
      uid: decodedToken.uid,
      email,
      pendingStatus: pendingRegistration.status,
      reservationStatus: reservation.status,
      reservationCurrentTokenHash: shortenHash(reservation.currentTokenHash),
    });

    try {
      await auth.getUserByEmail(email);
      jsonError(response, 409, "auth/email-already-in-use", "Email already in use.");
      return;
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    response.status(200).json({
      ok: true,
      email,
      flowVersion: REGISTRATION_FLOW_VERSION,
    });
  } catch (error) {
    logger.error("registrationFinalize", {
      code: error.code || "registration-finalize-failed",
      message: error.message || "Registration finalize failed.",
      stack: error.stack || null,
    });
    const code = error.code || "registration-finalize-failed";
    const status =
      code === "missing-auth-token"
        ? 400
        : code === "registration-requires-anonymous-user"
          ? 403
          : code === "pending-registration-expired"
            ? 410
            : code === "pending-registration-not-confirmed" ||
                code === "pending-registration-missing" ||
                code === "auth/email-already-in-use"
              ? 409
              : 500;
    jsonError(response, status, code, error.message || "Registration finalize failed.");
  }
};

exports.registrationStart = onRequest(PUBLIC_HTTP_OPTIONS, registrationStartHandler);
exports.registrationResend = onRequest(PUBLIC_HTTP_OPTIONS, registrationResendHandler);
exports.registrationCancel = onRequest(PUBLIC_HTTP_OPTIONS, registrationCancelHandler);
exports.registrationConfirm = onRequest(PUBLIC_HTTP_OPTIONS, registrationConfirmHandler);
exports.registrationConfirmApp = onRequest(PUBLIC_HTTP_OPTIONS, registrationConfirmAppHandler);
exports.registrationFinalize = onRequest(PUBLIC_HTTP_OPTIONS, registrationFinalizeHandler);
