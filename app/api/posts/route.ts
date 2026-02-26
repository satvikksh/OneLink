// app/api/posts/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Types } from "mongoose";
import { dbConnect } from "../../src/lib/ConnectDB";
import { Post } from "../../src/models/posts";
import User from "../../src/models/users";
import { getSessionBySignedToken } from "../../src/lib/session";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const filter: Record<string, unknown> = {};
    if (userId) {
      filter.user = userId;
    }

    const posts = await Post.find(filter).sort({ createdAt: -1 }).lean();
    const userIdsRaw: string[] = Array.from(
      new Set(
        posts
          .map((p: any) => (p?.user ? String(p.user) : ""))
          .filter(Boolean)
      )
    );
    const userIds = userIdsRaw.filter((id) => Types.ObjectId.isValid(id));
    const objectIds = userIds.map((id) => new Types.ObjectId(id));
    const users = objectIds.length
      ? await User.find({ _id: { $in: objectIds } }).select("_id name").lean()
      : [];
    const nameById = new Map(users.map((u: any) => [String(u._id), u.name]));

    const normalized = posts.map((p: any) => ({
      _id: p._id,
      user: nameById.get(String(p.user)) ?? p.user ?? null,
      userName: nameById.get(String(p.user)) ?? null,
      title: p.title ?? "",
      content: p.content ?? "",
      body: p.content ?? "",
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
    const signed = jar.get("session_id")?.value ?? null;
    const deviceKey = req.headers.get("x-device-key") || jar.get("device_key")?.value || null;

    if (!signed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pass device key during verification to avoid accidental session invalidation.
    const session = await getSessionBySignedToken(signed, deviceKey);

    if (!session || !session.user) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      res.cookies.delete("session_id");
      res.cookies.delete("auth_token");
      return res;
    }

    const body = await req.json();
    const { title, content, avatar } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Missing title or content" }, { status: 400 });
    }

    const userId = typeof session.user === "object" ? String((session.user as any)._id) : String(session.user);
    const userDoc = await User.findById(userId).select("name").lean();
    const userName = userDoc?.name ?? userId;

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
          user: userName,
          userName,
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
