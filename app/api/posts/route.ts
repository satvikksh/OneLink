// app/api/posts/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "../../src/lib/ConnectDB";
import { Post } from "../../src/models/posts";
import { getSessionBySignedToken, destroySession } from "../../src/lib/session";

const SESSION_COOKIE = "session_id";
const AUTH_COOKIE = "auth_token";

export async function GET() {
  try {
    await dbConnect();
    const posts = await Post.find({}).sort({ createdAt: -1 }).lean();

    const normalized = posts.map((p: any) => ({
      _id: p._id,
      user: p.user ?? null,
      title: p.title ?? "",
      content: p.content ?? "",
      avatar: p.avatar ?? null,
      likes: typeof p.likes === "number" ? p.likes : 0,
      comments: Array.isArray(p.comments) ? p.comments : [],
      shares: typeof p.shares === "number" ? p.shares : 0,
      createdAt: p.createdAt ?? p.created_at,
      updatedAt: p.updatedAt ?? p.updated_at,
    }));

    return NextResponse.json({ posts: normalized }, { status: 200 });
  } catch (err) {
    console.error("GET /api/posts error:", err);
    return NextResponse.json({ posts: [], error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const jar = await cookies();
    const signed = jar.get(SESSION_COOKIE)?.value || null;

    // device key: header > cookie
    const deviceKeyHeader = req.headers.get("x-device-key") || null;
    const deviceKeyCookie = jar.get("device_key")?.value || null;
    const deviceKey = deviceKeyHeader || deviceKeyCookie || null;

    if (!signed || !deviceKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getSessionBySignedToken(signed);
    if (!session) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      res.cookies.set(SESSION_COOKIE, "", { path: "/", httpOnly: true, maxAge: 0 });
      res.cookies.set(AUTH_COOKIE, "", { path: "/", httpOnly: true, maxAge: 0 });
      return res;
    }

    // server-side deviceKey check
    if (session.deviceKey && session.deviceKey !== deviceKey) {
      try { await destroySession(session.sid); } catch {}
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      res.cookies.set(SESSION_COOKIE, "", { path: "/", httpOnly: true, maxAge: 0 });
      res.cookies.set(AUTH_COOKIE, "", { path: "/", httpOnly: true, maxAge: 0 });
      return res;
    }

    // session.user may be populated doc or just id
    const userId =
      (session.user && (session.user as any)._id)
        ? String((session.user as any)._id)
        : String(session.user);

    const body = await req.json().catch(() => ({}));
    const { title, content, user, avatar } = body || {};
    const actualContent = content ?? body?.body ?? "";

    if (!title || !actualContent) {
      return NextResponse.json(
        { error: "Missing title or content" },
        { status: 400 }
      );
    }

    const created = await Post.create({
      user: user || userId,           // tum display-name bhi bhej rahe ho, ya id store kar sakte ho
      title,
      content: actualContent,
      avatar: avatar || "",
      likes: 0,
      comments: [],
    });

    const out = {
      _id: created._id,
      user: created.user,
      title: created.title,
      content: created.content,
      avatar: created.avatar,
      likes: created.likes ?? 0,
      comments: created.comments ?? [],
      shares: (created as any).shares ?? 0,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };

    return NextResponse.json({ post: out }, { status: 201 });
  } catch (err) {
    console.error("POST /api/posts error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
