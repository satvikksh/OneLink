export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "../../src/lib/ConnectDB";
import { Post } from "../../src/models/posts";


export async function GET() {
  await dbConnect();
  const posts = await Post.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(posts, { status: 200 });
}

export async function POST(req: Request) {
  await dbConnect();
  const { user, title, content, avatar } = await req.json();

  if (!user || !title || !content || !avatar) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const created = await Post.create({ user, title, content, avatar });
  return NextResponse.json(created, { status: 201 });
}
