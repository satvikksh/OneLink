// src/lib/session.ts
import Session from "../models/session";
import { dbConnect } from "./ConnectDB";
import { jwtVerify } from "jose";

const getCookieSecret = () => new TextEncoder().encode(process.env.COOKIE_SECRET || "");

export function generateSid(): string {
  try {
    if (typeof crypto !== "undefined" && (crypto as any).randomUUID) return (crypto as any).randomUUID();
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
  // populate user so session.user is full user doc (if available)
  const s = await Session.findOne({ sid }).populate("user");
  if (!s) return null;
  if (s.expiresAt && s.expiresAt.getTime() < Date.now()) {
    try { await Session.deleteOne({ _id: s._id }); } catch {}
    return null;
  }
  return s;
}

// verify signed cookie token and return the session doc
export async function getSessionBySignedToken(signedToken?: string) {
  if (!signedToken) return null;
  try {
    const { payload } = await jwtVerify(signedToken, getCookieSecret());
    const sid = (payload as any).sid;
    if (!sid) return null;
    return await getSessionBySid(sid);
  } catch (err) {
    // invalid token or expired
    return null;
  }
}

export async function destroySession(sid?: string) {
  if (!sid) return;
  await dbConnect();
  await Session.deleteOne({ sid });
}
