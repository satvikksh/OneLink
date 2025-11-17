// app/api/posts/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "../../src/lib/ConnectDB";
import { Post } from "../../src/models/posts";
import { getSessionBySignedToken } from "../../src/lib/session";
import { cookies } from "next/headers";

const COOKIE_NAME = "session_id";

async function getCurrentUserId() {
  try {
    const jar = cookies();
    const signed = (await jar).get(COOKIE_NAME)?.value;
    if (!signed) return null;
    const session = await getSessionBySignedToken(signed);
    if (!session) return null;
    return String((session.user as any)?._id || session.user);
  } catch (err) {
    console.error("getCurrentUserId error:", err);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect();

    const posts = await Post.find({}).sort({ createdAt: -1 }).lean().catch(() => {
      console.error("Post.find error:");
      return [];
    });

    const normalized = Array.isArray(posts) ? posts.map((p: any) => ({
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
    })) : [];

    return NextResponse.json({ posts: normalized }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/posts error:", err?.stack ?? err);
    return NextResponse.json({ posts: [], error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { title, content, user, avatar } = body || {};
    const actualContent = content ?? (body?.body ?? null);

    if (!title || !actualContent) {
      return NextResponse.json({ error: "Missing title or content" }, { status: 400 });
    }

    await dbConnect();

    const created = await Post.create({
      user: user ?? userId,
      title,
      content: actualContent,
      avatar: avatar ?? "",
      likes: 0,
      comments: [],
      // timestamps handled by schema timestamps:true
    });

    const out = {
      _id: created._id,
      user: created.user,
      title: created.title,
      content: created.content,
      avatar: created.avatar,
      likes: created.likes ?? 0,
      comments: created.comments ?? [],
      shares: created.shares ?? 0,
      createdAt: created.createdAt ?? new Date().toISOString(),
      updatedAt: created.updatedAt ?? new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, post: out }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/posts error:", err?.stack ?? err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
