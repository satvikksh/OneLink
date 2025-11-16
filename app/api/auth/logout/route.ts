// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionBySignedToken, destroySession } from "../../../src/lib/session";

export async function POST(req: Request) {
  try {
    const jar = cookies();
    const signedSession = (await jar).get("session_id")?.value;
    const session = await getSessionBySignedToken(signedSession);
    if (session) {
      await destroySession(session.sid);
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set({ name: "auth_token", value: "", path: "/", maxAge: 0 });
    res.cookies.set({ name: "session_id", value: "", path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    console.error("Logout error", err);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
