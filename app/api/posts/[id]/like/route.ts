// ...existing code...
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbConnect } from "../../../../src/lib/ConnectDB";
import { Post } from "../../../../src/models/posts";


type Params = { params: { id: string } };

export async function POST(_req: Request, { params }: Params) {
  try {
    await dbConnect();

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // remove unsupported `lean: true` option for findByIdAndUpdate
    const updated = await Post.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true } // return updated doc
    );

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Ensure _id is serializable (string)
    return NextResponse.json({ _id: updated._id.toString(), likes: updated.likes }, { status: 200 });
  } catch (err) {
    console.error("LIKE route error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
// ...existing code...