// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { dbConnect } from "../../../src/lib/ConnectDB";
import User from "../../../src/models/users";
import { createSession } from "../../../src/lib/session";
import { sanitizeDeviceKey, generateSignature } from "../../../src/lib/device";

const COOKIE_NAME = "auth_token";
const SESSION_COOKIE_NAME = "session_id";
const getCookieSecret = () => new TextEncoder().encode(process.env.COOKIE_SECRET || "");
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const email = (body?.email || "").toLowerCase().trim();
    const password = body?.password || "";
    const remember: boolean = !!body?.remember;
    const deviceKey = sanitizeDeviceKey(body?.deviceKey);

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // fetch user with password and signature explicitly
    const user = await User.findOne({ email }).select("+password +signature");
    if (!user) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    // signature logic: register or enforce
    if (user.signature) {
      // require client deviceKey to match
      if (!deviceKey || deviceKey !== user.signature) {
        // DEBUG LOG - signature mismatch (for dev)
        console.warn("LOGIN DEBUG - signature mismatch:", {
          userId: String(user._id),
          userSignature: user.signature,
          clientDeviceKey: deviceKey,
        });
        // return NextResponse.json({ error: "Device signature mismatch." }, { status: 401 });
      }
    } else {
      // register signature: prefer client key, else generate
      user.signature = deviceKey || generateSignature();
      try {
        await user.save();
      } catch (err) {
        console.error("save signature fail", err);
      }
    }

    // build safe user object (no password/signature)
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete (userObj as any).password;
    // do not include signature in userObj (we may return it separately)

    // create JWT auth token (optional)
    const maxAgeSec = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
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

    // create server session (store user as reference and deviceKey = user.signature)
    const ua = req.headers.get("user-agent") || "";
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "");
    const sessionDoc = await createSession({
      userId: String(user._id),
      deviceKey: user.signature || undefined,
      ua,
      ip,
      maxAgeSec,
    });

    // DEBUG LOGS: show values to help trace mismatches
    // (remove these logs in production)
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
      // ignore logging errors
      console.warn("LOGIN DEBUG: logging failed", logErr);
    }

    // sign session sid into cookie JWT
    let signedSessionCookie: string | null = null;
    try {
      signedSessionCookie = await new SignJWT({ sid: sessionDoc.sid, uid: String(user._id) })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${maxAgeSec}s`)
        .sign(getCookieSecret());
    } catch (err) {
      console.error("session cookie sign failed", err);
    }

    // response
    const res = NextResponse.json({
      message: "Login successful",
      user: userObj,
      redirect: "/",
      signature: user.signature,
    }, { status: 200 });

    // set HTTP only JWT cookie (optional)
    res.cookies.set({
      name: COOKIE_NAME,
      value: jwtToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSec,
    });

    // set signed session cookie (preferred)
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
      // fallback: raw sid (not recommended)
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
