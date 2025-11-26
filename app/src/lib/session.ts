// src/lib/session.ts
import Session from "../models/session";
import { dbConnect } from "./ConnectDB";
import { SignJWT, jwtVerify } from "jose";

const getCookieSecret = () => {
  const secret = process.env.COOKIE_SECRET;
  if (!secret || secret.length < 32) {
    console.warn(
      "[session] COOKIE_SECRET missing or too short. " +
        "Please set a strong 32+ chars secret in env. Using weak fallback."
    );
    return new TextEncoder().encode(
      "dev_fallback_cookie_secret__change_me_please"
    );
  }
  return new TextEncoder().encode(secret);
};

export function generateSid(): string {
  try {
    if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
      return (crypto as any).randomUUID();
    }
  } catch {}
  return (
    "s-" +
    Date.now().toString(36) +
    "-" +
    Math.floor(Math.random() * 1e9).toString(36)
  );
}

export async function createSession({
  userId,
  deviceKey,
  ua,
  ip,
  maxAgeSec = 60 * 60 * 24,
  meta,
}: {
  userId: string;
  deviceKey?: string;
  ua?: string;
  ip?: string;
  maxAgeSec?: number;
  meta?: Record<string, any>;
}) {
  await dbConnect();
  const sid = generateSid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + maxAgeSec * 1000);
  const doc = await Session.create({
    sid,
    user: userId,
    deviceKey,
    ua,
    ip,
    createdAt: now,
    expiresAt,
    meta: meta || {},
  });
  return doc;
}

export async function getSessionBySid(sid?: string) {
  if (!sid) return null;
  await dbConnect();
  const s = await Session.findOne({ sid }).populate("user");
  if (!s) return null;
  if (s.expiresAt && s.expiresAt.getTime() < Date.now()) {
    try {
      await Session.deleteOne({ _id: s._id });
    } catch {}
    return null;
  }
  return s;
}

/**
 * Sign sid + uid into a JWT (session cookie).
 */
export async function signSessionToken(params: {
  sid: string;
  uid: string;
  maxAgeSec: number;
}) {
  const { sid, uid, maxAgeSec } = params;
  const secret = getCookieSecret();

  const jwt = await new SignJWT({ sid, uid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(secret);

  return jwt;
}

/**
 * Verify signed token (JWT). If deviceKey is provided, ensure the session.deviceKey matches.
 *
 * NOTE: we still keep the "raw sid" fallback for older cookies, but if a session exists with
 * a deviceKey and it does not match the provided deviceKey we WILL delete that session and return null.
 *
 * Usage: getSessionBySignedToken(signedToken, clientDeviceKey)
 */
export async function getSessionBySignedToken(
  signedToken?: string,
  clientDeviceKey?: string | null
) {
  if (!signedToken) return null;
  const secret = getCookieSecret();

  // 1) try JWT
  try {
    const { payload } = await jwtVerify(signedToken, secret);
    const sid = (payload as any).sid as string | undefined;
    if (!sid) return null;

    const sess = await getSessionBySid(sid);
    if (!sess) return null;

    // If session has deviceKey, enforce match (if client provided one)
    if (sess.deviceKey) {
      if (!clientDeviceKey || String(sess.deviceKey) !== String(clientDeviceKey)) {
        // Device mismatch — destroy session (prevent hijack)
        try {
          await Session.deleteOne({ _id: sess._id });
        } catch {}
        return null;
      }
    }
    return sess;
  } catch (err) {
    // JWT verify failed → fall through to raw sid fallback
  }

  // 2) fallback: raw sid
  try {
    const sess = await getSessionBySid(signedToken);
    if (!sess) return null;

    // Enforce deviceKey if present in session
    if (sess.deviceKey) {
      if (!clientDeviceKey || String(sess.deviceKey) !== String(clientDeviceKey)) {
        try {
          await Session.deleteOne({ _id: sess._id });
        } catch {}
        return null;
      }
    }
    return sess;
  } catch {
    return null;
  }
}

export async function destroySession(sid?: string) {
  if (!sid) return;
  await dbConnect();
  await Session.deleteOne({ sid });
}
