import { NextResponse } from "next/server";
import { dbConnect } from "../../../../src/lib/ConnectDB";
import { Post } from "../../../../src/models/posts";


export async function POST(req: Request, { params }: any)  {
  await dbConnect();
  const { id } = params;
  const { text } = await req.json();

  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  const updated = await Post.findByIdAndUpdate(
    id,
    { $push: { comments: { text } } },
    { new: true }
  ).lean();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated, { status: 200 });
}
