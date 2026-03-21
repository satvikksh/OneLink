import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession, getSessionBySignedToken } from "../../../src/lib/session";

export async function POST(req: Request) {
  try {
    const jar = await cookies();
    const signedSession = jar.get("session_id")?.value;
    const deviceKey =
      req.headers.get("x-device-key") || jar.get("device_key")?.value || null;

    const session = await getSessionBySignedToken(signedSession, deviceKey);
    if (session) {
      await destroySession(session.sid);
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({ name: "auth_token", value: "", path: "/", maxAge: 0 });
    response.cookies.set({ name: "session_id", value: "", path: "/", maxAge: 0 });
    response.cookies.set({ name: "device_key", value: "", path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    console.error("Logout error", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
