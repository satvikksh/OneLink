import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { Post } from "@/models/Post";

type Params = { params: { id: string } };

export async function POST(_: Request, { params }: Params) {
  await dbConnect();
  const { id } = params;
  const updated = await Post.findByIdAndUpdate(
    id,
    { $inc: { likes: 1 } },
    { new: true }
  ).lean();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated, { status: 200 });
}
