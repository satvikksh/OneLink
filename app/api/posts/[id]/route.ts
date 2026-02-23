// app/api/posts/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "../../../src/lib/ConnectDB";
import { Post } from "../../../src/models/posts";
import { getSessionBySignedToken } from "../../../src/lib/session";

const COOKIE_NAME = "session_id";

async function getCurrentUserId(req: Request) {
  const jar = await cookies();
  const signed = jar.get(COOKIE_NAME)?.value;
  if (!signed) return null;

  const deviceKey = req.headers.get("x-device-key") || jar.get("device_key")?.value || null;
  const session = await getSessionBySignedToken(signed, deviceKey);
  if (!session) return null;

  return String((session.user as any)?._id || session.user);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const body = await req.json();

    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    if (String(post.user) !== String(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    post.title = body.title ?? post.title;
    post.content = body.content ?? body.body ?? post.content;
    post.updatedAt = new Date();
    await post.save();

    return NextResponse.json({ ok: true, post }, { status: 200 });
  } catch (err) {
    console.error("PUT /api/posts/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    if (String(post.user) !== String(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await Post.deleteOne({ _id: id });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/posts/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
