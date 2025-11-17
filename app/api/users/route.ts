// app/api/users/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "../../src/lib/ConnectDB";
import User from "../../src/models/users";
import { getSessionBySignedToken, destroySession } from "../../src/lib/session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "session_id";
const AUTH_TOKEN_NAME = "auth_token";

/** helper: read current user id + session sid from signed session cookie */
async function getCurrentUserId() {
  const jar = cookies();
  const signed = (await jar).get(COOKIE_NAME)?.value;
  if (!signed) return null;
  const session = await getSessionBySignedToken(signed);
  if (!session) return null;
  return { id: String((session.user as any)?._id || session.user), sessionSid: session.sid };
}

/** GET: public list of users (hide sensitive fields) */
export async function GET() {
  try {
    await dbConnect();

    const users = await User.find({})
      .select("-password -signature")
      .lean()
      .catch((e) => {
        console.error("User.find error:", e);
        return [];
      });

    const out = (users || []).map((u: any) => ({
      _id: u._id,
      id: u._id,
      username: u.username,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar ?? null,
      headline: u.headline ?? null,
      about: u.about ?? null,
      createdAt: u.createdAt ?? null,
    }));

    return NextResponse.json({ users: out }, { status: 200 });
  } catch (err) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ users: [], error: "Server error" }, { status: 500 });
  }
}

/** PUT: update current user's profile (and optionally change password) */
export async function PUT(req: Request) {
  try {
    const cu = await getCurrentUserId();
    if (!cu) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const updates: any = {};

    // allowed profile fields
    if (body.name) updates.name = String(body.name).trim();
    if (body.username) updates.username = String(body.username).trim().toLowerCase();
    if (body.email) updates.email = String(body.email).trim().toLowerCase();
    if (body.headline !== undefined) updates.headline = body.headline;
    if (body.about !== undefined) updates.about = body.about;
    if (body.profileImage !== undefined) updates.avatar = body.profileImage;

    // Password change handling
    // To change password require `currentPassword` and `newPassword`
    const wantsPasswordChange = body.currentPassword && body.newPassword;
    if (wantsPasswordChange) {
      // fetch user with password
      const userWithPwd = await User.findById(cu.id).select("+password");
      if (!userWithPwd) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const ok = await bcrypt.compare(String(body.currentPassword), userWithPwd.password);
      if (!ok) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }

      // basic validation for new password length
      if (String(body.newPassword).length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }

      updates.password = await bcrypt.hash(String(body.newPassword), 10);
    }

    // If username or email changed — check uniqueness
    if (updates.email || updates.username) {
      const conflict = await User.findOne({
        $or: [{ email: updates.email }, { username: updates.username }],
        _id: { $ne: cu.id },
      }).lean();
      if (conflict) {
        return NextResponse.json({ error: "Email or username already taken" }, { status: 409 });
      }
    }

    // Apply updates
    const opts: any = { new: true, runValidators: true };
    const updated = await User.findByIdAndUpdate(cu.id, updates, opts)
      .select("-password -signature")
      .lean();

    // If password changed — best practice: destroy other sessions (optional)
    if (wantsPasswordChange) {
      try {
        // destroy current session so user must re-login everywhere if desired
        if (cu.sessionSid) await destroySession(cu.sessionSid);
      } catch (e) {
        console.error("destroySession error after password change:", e);
      }
    }

    return NextResponse.json({ ok: true, user: updated }, { status: 200 });
  } catch (err) {
    console.error("PUT /api/users error:", err);
    // handle duplicate key race
    if ((err as any)?.code === 11000) {
      return NextResponse.json({ error: "Email or username already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** DELETE: delete current user's account */
export async function DELETE(req: Request) {
  try {
    const cu = await getCurrentUserId();
    if (!cu) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    // Remove user record (cascade other resources if needed: posts, sessions, etc.)
    await User.deleteOne({ _id: cu.id });

    // destroy server session and clear cookies
    try { await destroySession(cu.sessionSid); } catch (e) { console.error("destroySession error:", e); }

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.cookies.set(COOKIE_NAME, "", { path: "/", httpOnly: true, maxAge: 0 });
    res.cookies.set(AUTH_TOKEN_NAME, "", { path: "/", httpOnly: true, maxAge: 0 });
    return res;
  } catch (err) {
    console.error("DELETE /api/users error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
