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

    const jar = cookies();
    const signed = (await jar).get("session_id")?.value ?? null;

    if (!signed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getSessionBySignedToken(signed);

    if (!session || !session.user) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      res.cookies.delete("session_id");
      res.cookies.delete("auth_token");
      return res;
    }

    // OPTIONAL device key check (soft check, not hard fail)
    const deviceKey =
      req.headers.get("x-device-key") ||
      (await jar).get("device_key")?.value ||
      null;

    if (
      deviceKey &&
      session.deviceKey &&
      session.deviceKey !== deviceKey
    ) {
      // Do NOT destroy session here – just reject this request
      return NextResponse.json(
        { error: "Device mismatch" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, content, avatar } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing title or content" },
        { status: 400 }
      );
    }

    const userId =
      typeof session.user === "object"
        ? String((session.user as any)._id)
        : String(session.user);

    const created = await Post.create({
      user: userId,
      title,
      content,
      avatar: avatar ?? "",
      likes: 0,
      comments: [],
    });

    return NextResponse.json(
      {
        post: {
          _id: created._id,
          user: created.user,
          title: created.title,
          content: created.content,
          avatar: created.avatar,
          likes: created.likes,
          comments: created.comments,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/posts error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
