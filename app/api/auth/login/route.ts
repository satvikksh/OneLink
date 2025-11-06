import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { dbConnect } from "../../../src/lib/ConnectDB";
import User from "../../../src/models/users";

// keep your cookie name
const COOKIE_NAME = "auth_token";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const email = (body?.email || "").toLowerCase().trim();
    const password = body?.password || "";
    const remember: boolean = !!body?.remember; // optional flag from client

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // include password (schema likely has select:false)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // prepare safe user object
    const userObj = user.toObject();
    delete (userObj as any).password;

    // JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const maxAgeSec = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30d or 1d

    const token = await new SignJWT({
      id: user._id,
      email: user.email,
      role: user.role,
      username: user.username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${maxAgeSec}s`)
      .sign(secret);

    // success response + cookie
    const res = NextResponse.json(
      {
        message: "Login successful 🎉",
        user: userObj,
        redirect: "/", // ⬅️ send user to HOME after login
      },
      { status: 200 }
    );

    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSec,
    });

    // avoid caching auth responses
    res.headers.set("Cache-Control", "no-store");

    return res;
  } catch (err) {
    console.error("❌ Login Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
