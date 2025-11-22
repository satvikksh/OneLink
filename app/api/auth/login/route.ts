// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { dbConnect } from "../../../src/lib/ConnectDB";
import User from "../../../src/models/users";
import { createSession, signSessionToken } from "../../../src/lib/session";
import { sanitizeDeviceKey, generateSignature } from "../../../src/lib/device";

const COOKIE_NAME = "auth_token";
const SESSION_COOKIE_NAME = "session_id";

const getCookieSecret = () => {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    throw new Error("COOKIE_SECRET is not set in environment variables");
  }
  return new TextEncoder().encode(secret);
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || "default_secret";
  return new TextEncoder().encode(secret);
};

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const email = (body?.email || "").toLowerCase().trim();
    const password = body?.password || "";
    const remember: boolean = !!body?.remember;
    const deviceKey = sanitizeDeviceKey(body?.deviceKey);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).select("+password +signature");
    if (!user)
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );

    // signature logic
    if (user.signature) {
      if (!deviceKey || deviceKey !== user.signature) {
        console.warn("LOGIN DEBUG - signature mismatch:", {
          userId: String(user._id),
          userSignature: user.signature,
          clientDeviceKey: deviceKey,
        });
        // NOTE: currently NOT blocking login, just logging.
        // Agar block karna ho to yaha 401 return kar sakte ho.
      }
    } else {
      user.signature = deviceKey || generateSignature();
      try {
        await user.save();
      } catch (err) {
        console.error("save signature fail", err);
      }
    }

    const userObj = user.toObject ? user.toObject() : { ...user };
    delete (userObj as any).password;
    delete (userObj as any).signature;

    const maxAgeSec = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

    // auth JWT (user info)
    const jwtToken = await new SignJWT({
      id: String(user._id),
      email: user.email,
      role: user.role,
      username: user.username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${maxAgeSec}s`)
      .sign(getJwtSecret());

    // server session
    const ua = req.headers.get("user-agent") || "";
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "";

    const sessionDoc = await createSession({
      userId: String(user._id),
      deviceKey: user.signature || undefined,
      ua,
      ip,
      maxAgeSec,
    });

    try {
      console.log("LOGIN DEBUG: user and device info", {
        userId: String(user._id),
        userSignature: user.signature,
        clientDeviceKey: deviceKey,
        sessionSid: sessionDoc?.sid,
        sessionDeviceKey: sessionDoc?.deviceKey,
        ua,
        ip,
      });
    } catch (logErr) {
      console.warn("LOGIN DEBUG: logging failed", logErr);
    }

    // ✅ yahi se session-id ko bhi JWT banate hain (sid + uid), joh tum chahte ho
    let signedSessionCookie: string | null = null;
    try {
      signedSessionCookie = await signSessionToken({
        sid: sessionDoc.sid,
        uid: String(user._id),
        maxAgeSec,
      });
    } catch (err) {
      console.error("session cookie sign failed", err);
    }

    const res = NextResponse.json(
      {
        message: "Login successful",
        user: userObj,
        redirect: "/",
        signature: user.signature,
      },
      { status: 200 }
    );

    // auth_token cookie
    res.cookies.set({
      name: COOKIE_NAME,
      value: jwtToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSec,
    });

    // session_id cookie – ALWAYS try to set JWT
    if (signedSessionCookie) {
      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: signedSessionCookie,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: maxAgeSec,
      });
    } else {
      // fallback (rare) – raw sid
      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: sessionDoc.sid,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: maxAgeSec,
      });
    }

    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
