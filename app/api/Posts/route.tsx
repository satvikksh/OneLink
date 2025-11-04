import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { Post } from "@/models/Post";

export async function GET() {
  await dbConnect();
  const posts = await Post.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(posts, { status: 200 });
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { user, title, content, avatar } = body;

    if (!user || !title || !content || !avatar) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const created = await Post.create({ user, title, content, avatar });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
