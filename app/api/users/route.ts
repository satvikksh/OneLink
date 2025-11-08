// app/api/users/route.ts (Next 13 app router)
import { NextResponse } from "next/server";
import { dbConnect } from "../../src/lib/ConnectDB";   // ✅
import User from "../../src/models/users";   

export async function GET() {
  try {
    await dbConnect();

    // Select only public fields, exclude password
    const users = await User.find({}, { password: 0, __v: 0 }).lean();

    // map if you want to normalize
    const out = users.map(u => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      email: u.email ? undefined : undefined, // don't send email publicly, optional
      role: u.role,
    //   avatar: u.avatar ?? "",
      // any extra fields
    }));

    return NextResponse.json(out, { status: 200 });
  } catch (err) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
