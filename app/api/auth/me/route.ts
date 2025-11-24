// app/api/auth/me/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "../../../src/lib/ConnectDB";
import User from "../../../src/models/users";
import {
  getSessionBySignedToken,
  destroySession,
} from "../../../src/lib/session";

export async function GET(req: Request) {
  try {
    const jar = cookies();

    // signed session cookie
    const signedSession = (await jar).get("session_id")?.value;

    // deviceKey from header or cookie
    let deviceKeyHeader: string | null = null;
    try {
      deviceKeyHeader = req.headers.get("x-device-key") || null;
    } catch {}

    if (!deviceKeyHeader) {
      try {
        const ck = (await jar).get("device_key")?.value;
        if (ck) deviceKeyHeader = ck;
      } catch {}
    }

    try {
      console.log(
        "ME: received x-device-key header:",
        deviceKeyHeader ? "[present]" : "[missing]"
      );
    } catch {}

    const session = await getSessionBySignedToken(signedSession);

    if (!session) {
      return NextResponse.json({ user: null, error: "UNAUTH" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    if (!sessionUser || !sessionUser._id) {
      try {
        await destroySession(session.sid);
      } catch {}

      const res = NextResponse.json(
        { user: null, error: "INVALID_SESSION" },
        { status: 401 }
      );
      res.cookies.set("session_id", "", {
        path: "/",
        httpOnly: true,
        maxAge: 0,
      });
      res.cookies.set("auth_token", "", {
        path: "/",
        httpOnly: true,
        maxAge: 0,
      });
      return res;
    }

    // deviceKey check
    if (session.deviceKey) {
      if (!deviceKeyHeader || deviceKeyHeader !== String(session.deviceKey)) {
        try {
          console.warn("ME: deviceKey mismatch — destroying session", {
            sid: session.sid,
          });
          await destroySession(session.sid);
        } catch (e) {
          console.error("ME: destroySession error", e);
        }

        const res = NextResponse.json(
          { user: null, error: "SIGNATURE_MISMATCH" },
          { status: 401 }
        );
        res.cookies.set("session_id", "", {
          path: "/",
          httpOnly: true,
          maxAge: 0,
        });
        res.cookies.set("auth_token", "", {
          path: "/",
          httpOnly: true,
          maxAge: 0,
        });
        return res;
      }
    } else {
      // unsafe session without deviceKey
      try {
        console.warn("ME: session exists without deviceKey — destroying", {
          sid: session.sid,
        });
        await destroySession(session.sid);
      } catch (e) {}

      const res = NextResponse.json(
        { user: null, error: "UNSAFE_SESSION" },
        { status: 401 }
      );
      res.cookies.set("session_id", "", {
        path: "/",
        httpOnly: true,
        maxAge: 0,
      });
      res.cookies.set("auth_token", "", {
        path: "/",
        httpOnly: true,
        maxAge: 0,
      });
      return res;
    }

    await dbConnect();
    const user = await User.findById(String(sessionUser._id))
      .select("+signature")
      .lean();

    if (!user) {
      try {
        await destroySession(session.sid);
      } catch {}
      const res = NextResponse.json(
        { user: null, error: "USER_NOT_FOUND" },
        { status: 401 }
      );
      res.cookies.set("session_id", "", {
        path: "/",
        httpOnly: true,
        maxAge: 0,
      });
      res.cookies.set("auth_token", "", {
        path: "/",
        httpOnly: true,
        maxAge: 0,
      });
      return res;
    }

    if (String(sessionUser._id) !== String(user._id)) {
      try {
        await destroySession(session.sid);
      } catch {}
      const res = NextResponse.json(
        { user: null, error: "SESSION_USER_MISMATCH" },
        { status: 401 }
      );
      res.cookies.set("session_id", "", {
        path: "/",
        httpOnly: true,
        maxAge: 0,
      });
      res.cookies.set("auth_token", "", {
        path: "/",
        httpOnly: true,
        maxAge: 0,
      });
      return res;
    }

    if ((user as any).password) delete (user as any).password;
    if ((user as any).signature) delete (user as any).signature;

    try {
      console.log("ME: auth success");
    } catch {}

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("/api/auth/me error:", err);
    return NextResponse.json(
      { user: null, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
