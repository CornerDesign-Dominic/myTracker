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
const DEFAULT_CONFIRMATION_URL =
  "https://europe-west1-mytracker-0.cloudfunctions.net/registrationConfirm";

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

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const buildPendingRegistrationState = (email, now, status = "pending") => ({
  status,
  pendingEmail: email,
  startedAt: now.toISOString(),
  expiresAt: new Date(now.getTime() + TOKEN_TTL_MS).toISOString(),
  lastRequestedAt: now.toISOString(),
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
  resendApiKey: process.env.RESEND_API_KEY,
  registrationMailFrom: process.env.REGISTRATION_MAIL_FROM,
});

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
      subject: "Bitte bestätige deine E-Mail",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <p>Bitte bestätige deine E-Mail innerhalb von 72 Stunden.</p>
          <p style="margin:24px 0">
            <a href="${confirmationUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#15803D;color:#ffffff;text-decoration:none;font-weight:600">
              E-Mail bestätigen
            </a>
          </p>
          <p>Vorher wird keine Verbindung mit deiner Mail hergestellt.</p>
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

const renderHtml = (title, message) => `<!doctype html>
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
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>${title}</h1>
        <p>${message}</p>
      </section>
    </main>
  </body>
</html>`;

const registrationStartHandler = async (request, response) => {
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
    const email = String(request.body?.email ?? "").trim().toLowerCase();
    const { confirmationBaseUrl } = getRegistrationConfig();

    if (!validateEmail(email)) {
      jsonError(response, 400, "invalid-email", "Email is invalid.");
      return;
    }

    await ensureEmailUnused(email);

    const now = new Date();
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const confirmationUrl = `${confirmationBaseUrl}?token=${encodeURIComponent(token)}`;
    const pendingRegistration = buildPendingRegistrationState(email, now, "pending");

    await db.collection(REGISTRATION_COLLECTION).doc(tokenHash).set({
      uid: decodedToken.uid,
      email,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(now.getTime() + TOKEN_TTL_MS)),
    });

    await db.collection("users").doc(decodedToken.uid).set(
      {
        pendingRegistration,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    try {
      await sendConfirmationEmail({ email, confirmationUrl });
    } catch (error) {
      await db.collection("users").doc(decodedToken.uid).set(
        {
          pendingRegistration: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      await db.collection(REGISTRATION_COLLECTION).doc(tokenHash).delete();
      throw error;
    }

    response.status(200).json({ ok: true });
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
        : code === "invalid-email" || code === "missing-auth-token"
          ? 400
          : code === "registration-requires-anonymous-user"
            ? 403
            : 500;
    jsonError(response, status, code, error.message || "Registration start failed.");
  }
};

const registrationResendHandler = async (request, response) => {
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

    const email = String(pendingRegistration.pendingEmail ?? "").trim().toLowerCase();
    const now = new Date();
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const confirmationUrl = `${confirmationBaseUrl}?token=${encodeURIComponent(token)}`;
    const nextPendingRegistration = {
      ...pendingRegistration,
      status: "pending",
      expiresAt: new Date(now.getTime() + TOKEN_TTL_MS).toISOString(),
      lastRequestedAt: now.toISOString(),
    };

    await ensureEmailUnused(email);

    await db.collection(REGISTRATION_COLLECTION).doc(tokenHash).set({
      uid: decodedToken.uid,
      email,
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

    try {
      await sendConfirmationEmail({ email, confirmationUrl });
    } catch (error) {
      await db.collection(REGISTRATION_COLLECTION).doc(tokenHash).delete();
      throw error;
    }

    response.status(200).json({ ok: true });
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
        : code === "registration-not-pending" || code === "registration-already-confirmed" || code === "registration-cancelled"
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

const registrationConfirmHandler = async (request, response) => {
  const token = String(request.query.token ?? "");
  if (!token) {
    response.status(400).send(renderHtml("Link ungültig", "Der Bestätigungslink ist unvollständig."));
    return;
  }

  const tokenHash = hashToken(token);
  const tokenRef = db.collection(REGISTRATION_COLLECTION).doc(tokenHash);
  const tokenSnapshot = await tokenRef.get();

  if (!tokenSnapshot.exists) {
    response.status(410).send(renderHtml("Link abgelaufen", "Dieser Bestätigungslink ist nicht mehr gültig."));
    return;
  }

  const tokenData = tokenSnapshot.data();
  const expiresAt = tokenData?.expiresAt?.toDate?.();
  const usedAt = tokenData?.usedAt?.toDate?.();

  if (usedAt || !(expiresAt instanceof Date) || expiresAt.getTime() <= Date.now()) {
    response.status(410).send(renderHtml("Link abgelaufen", "Dieser Bestätigungslink ist nicht mehr gültig."));
    return;
  }

  const userRef = db.collection("users").doc(String(tokenData.uid));
  const userSnapshot = await userRef.get();
  const pendingRegistration = userSnapshot.data()?.pendingRegistration;

  if (
    !pendingRegistration ||
    pendingRegistration.status !== "pending" ||
    pendingRegistration.pendingEmail !== tokenData.email
  ) {
    response.status(409).send(renderHtml("Bestätigung nicht möglich", "Dieser Vorgang ist nicht mehr offen."));
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
    response.status(410).send(renderHtml("Bestätigung abgelaufen", "Die Registrierung ist abgelaufen. Bitte starte sie erneut in der App."));
    return;
  }

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
      tokenRef,
      {
        status: "confirmed",
        usedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  response
    .status(200)
    .send(renderHtml("E-Mail bestätigt", "E-Mail bestätigt. Du kannst jetzt zur App zurückkehren."));
};

const registrationFinalizeHandler = async (request, response) => {
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

    try {
      await auth.getUserByEmail(pendingRegistration.pendingEmail);
      jsonError(response, 409, "auth/email-already-in-use", "Email already in use.");
      return;
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    response.status(200).json({
      ok: true,
      email: pendingRegistration.pendingEmail,
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

exports.registrationStart = onRequest({ region: REGION }, registrationStartHandler);
exports.registrationResend = onRequest({ region: REGION }, registrationResendHandler);
exports.registrationConfirm = onRequest({ region: REGION }, registrationConfirmHandler);
exports.registrationFinalize = onRequest({ region: REGION }, registrationFinalizeHandler);
