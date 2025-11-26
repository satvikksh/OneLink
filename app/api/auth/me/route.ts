// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "../../../src/lib/ConnectDB";
import User from "../../../src/models/users";
import { getSessionBySignedToken, destroySession } from "../../../src/lib/session";

const SESSION_COOKIE = "session_id";
const AUTH_COOKIE = "auth_token";

export async function GET(req: Request) {
  try {
    await dbConnect();

    // cookies() must be awaited (server-side)
    const jar = await cookies();

    // read signed session cookie (JWT or raw sid)
    const signedSession = jar.get(SESSION_COOKIE)?.value || null;

    // read device key: prefer header, fallback to optional cookie 'device_key'
    const deviceKeyHeader = req.headers.get("x-device-key") || null;
    const deviceKeyCookie = jar.get("device_key")?.value || null;
    const deviceKey = deviceKeyHeader || deviceKeyCookie || null;

    // If you require header strictly, uncomment this block.
    // if (!deviceKeyHeader) {
    //   return NextResponse.json({ user: null, error: "missing x-device-key header" }, { status: 401 });
    // }

    if (!signedSession) {
      // no session cookie => not authenticated
      return NextResponse.json({ user: null, error: "NO_SESSION" }, { status: 401 });
    }

    // verify session (this will also do JWT verify + raw sid fallback)
    const session = await getSessionBySignedToken(signedSession, deviceKey);

    if (!session) {
      // invalid or device mismatch; ensure cookies cleared
      const res = NextResponse.json({ user: null, error: "INVALID_SESSION" }, { status: 401 });
      res.cookies.set(SESSION_COOKIE, "", { path: "/", httpOnly: true, maxAge: 0 });
      res.cookies.set(AUTH_COOKIE, "", { path: "/", httpOnly: true, maxAge: 0 });
      return res;
    }

    // session found — determine user id (session.user may be populated or just id)
    const userId = (session.user && (session.user as any)._id) ? String((session.user as any)._id) : String(session.user);

    // load user (select sensitive fields off)
    const user = await User.findById(userId).select("-password -signature").lean();
    if (!user) {
      // user not found — destroy and clear cookies
      try { await destroySession(session.sid); } catch {}
      const res = NextResponse.json({ user: null, error: "USER_NOT_FOUND" }, { status: 401 });
      res.cookies.set(SESSION_COOKIE, "", { path: "/", httpOnly: true, maxAge: 0 });
      res.cookies.set(AUTH_COOKIE, "", { path: "/", httpOnly: true, maxAge: 0 });
      return res;
    }

    // OK
    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("/api/auth/me error:", err);
    return NextResponse.json({ user: null, error: "SERVER_ERROR" }, { status: 500 });
  }
}
