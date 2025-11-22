// src/lib/session.ts
import Session from "../models/session";
import { dbConnect } from "./ConnectDB";
import { SignJWT, jwtVerify } from "jose";

const getCookieSecret = () => {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    throw new Error("COOKIE_SECRET is not set in environment variables");
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
  return "s-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e9).toString(36);
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

// helper: sign sid + uid into a JWT (this is your "session id" style)
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

  return jwt; // looks like: eyJhbGciOiJIUzI1NiJ9.eyJzaWQiOiIuLi4iLCJ1aWQiOiIuLi4iLCJpYXQiOj..., आदि
}

// verify signed cookie token and return the session doc
export async function getSessionBySignedToken(signedToken?: string) {
  if (!signedToken) return null;
  try {
    const secret = getCookieSecret();
    const { payload } = await jwtVerify(signedToken, secret);
    const sid = (payload as any).sid as string | undefined;
    if (!sid) return null;
    return await getSessionBySid(sid);
  } catch {
    // invalid token or expired
    return null;
  }
}

export async function destroySession(sid?: string) {
  if (!sid) return;
  await dbConnect();
  await Session.deleteOne({ sid });
}
