// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import mongoose from "mongoose";
import { dbConnect } from "../../../src/lib/ConnectDB";
import User from "../../../src/models/users";

const COOKIE_NAME = "auth_token";
const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");

export async function GET() {
  const jar = cookies();
  const token = (await jar).get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ user: null, error: "NO_TOKEN" }, { status: 401 });
  }

  try {
    // verify token
    const { payload } = await jwtVerify(token, getSecret());

    // normalize possible payload shapes
    // payload may contain { id: "..."} or { sub: "..." } or { email: "..." } etc.
    const maybeId = (payload as any).id ?? (payload as any).sub ?? null;
    const maybeEmail = (payload as any).email ?? null;

    await dbConnect();

    let user: any = null;

    if (maybeId) {
      // if id is an object, convert to string (handles ObjectId-like payloads)
      const idStr = typeof maybeId === "object" ? String(maybeId) : maybeId;

      // validate ObjectId format first
      if (mongoose.isValidObjectId(idStr)) {
        user = await User.findById(idStr).select("-password").lean();
      } else {
        // not a valid ObjectId string — maybe it's an email or username — fallback below
        user = null;
      }
    }

    // fallback: if we didn't find via id, try using email from payload (or id might actually be an email)
    if (!user && maybeEmail) {
      user = await User.findOne({ email: (maybeEmail as string).toLowerCase().trim() })
        .select("-password")
        .lean();
    }

    // extra fallback: sometimes token's id was actually an email string
    if (!user && maybeId && typeof maybeId === "string" && maybeId.includes("@")) {
      user = await User.findOne({ email: maybeId.toLowerCase().trim() }).select("-password").lean();
    }

    if (!user) {
      // clear cookie to prevent repeated verification attempts with bad token
      const res = NextResponse.json({ user: null, error: "USER_NOT_FOUND" }, { status: 401 });
      res.cookies.set(COOKIE_NAME, "", { path: "/", httpOnly: true, maxAge: 0 });
      return res;
    }

    // success
    return NextResponse.json({ user }, { status: 200 });
  } catch (err: any) {
    console.error("/api/auth/me verify error:", err?.message ?? err);
    // clear cookie when token invalid/expired
    const res = NextResponse.json({ user: null, error: "TOKEN_EXPIRED_OR_INVALID" }, { status: 401 });
    res.cookies.set(COOKIE_NAME, "", { path: "/", httpOnly: true, maxAge: 0 });
    return res;
  }
}
