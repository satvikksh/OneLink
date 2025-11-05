import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";  // 👈 Add this import
import { dbConnect } from "../../src/lib/ConnectDB";   
import User from "../../src/models/users";  

// 👇 Cookie name constant
const COOKIE_NAME = "auth_token";

/**
 * POST /api/auth/login
 * body: { email: string, password: string }
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Remove password from returned user object
    const userObj = user.toObject();
    delete (userObj as any).password;

    // ✅ Generate JWT Token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const token = await new SignJWT({
      id: user._id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d") // expires in 1 day
      .sign(secret);

    // ✅ Create response and set secure HTTP-only cookie
    const res = NextResponse.json(
      {
        message: "Login successful 🎉",
        user: userObj,
        redirect: "/dashboard",
      },
      { status: 200 }
    );

    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,          // not accessible from JS
      secure: process.env.NODE_ENV === "production", // true on https
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,    // 1 day
    });

    return res;

  } catch (err: any) {
    console.error("❌ Login Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
