// src/lib/session.ts
import Session from "../models/session";
import { dbConnect } from "./ConnectDB";
import { SignJWT, jwtVerify } from "jose";

const getCookieSecret = () => {
  // ✅ yaha se DONO: signSessionToken + getSessionBySignedToken secret lenge
  const secret = process.env.COOKIE_SECRET;

  // agar set nahi hai ya chhota hai to warning + safe fallback (sirf emergency ke liye)
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
  // fallback
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
 * ✅ sid + uid ko JWT me sign karta hai – ye hi tumhara "session cookie" hai
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
 * ✅ pehle JWT verify karta hai; agar fail ho jaye to OLD raw sid pe fallback
 * (fallback sirf isliye, kyunki pehle production me raw UUID cookie aa rahi thi)
 */
export async function getSessionBySignedToken(signedToken?: string) {
  if (!signedToken) return null;

  const secret = getCookieSecret();

  // 1) try as JWT (recommended path)
  try {
    const { payload } = await jwtVerify(signedToken, secret);
    const sid = (payload as any).sid as string | undefined;
    if (!sid) return null;
    return await getSessionBySid(sid);
  } catch (err) {
    console.warn(
      "[session] jwtVerify failed for session_id – trying raw sid fallback"
    );
  }

  // 2) fallback: treat entire cookie as raw sid (for old sessions)
  try {
    return await getSessionBySid(signedToken);
  } catch {
    return null;
  }
}

export async function destroySession(sid?: string) {
  if (!sid) return;
  await dbConnect();
  await Session.deleteOne({ sid });
}
