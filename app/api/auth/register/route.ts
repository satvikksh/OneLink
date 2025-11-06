import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "../../../src/lib/ConnectDB";   // ✅
import User from "../../../src/models/users";         // ✅

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    let { name, username, email, password, role } = body || {};

    // normalize
    name = (name || "").trim();
    username = (username || "").trim().toLowerCase();
    email = (email || "").trim().toLowerCase();

    // validate
    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    // duplicate check (email OR username)
    const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (existing) {
      return NextResponse.json(
        { error: existing.email === email ? "Email already registered." : "Username already taken." },
        { status: 409 }
      );
    }

    // hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // create
    const created = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role: role || "student",
    });

    const { password: _password, ...obj } = created.toObject();

    return NextResponse.json(
      { message: "User registered successfully 🎉", user: obj, redirect: "/login" },
      { status: 201 }
    );
  } catch (err: any) {
    // unique index race condition
    if (err?.code === 11000) {
      return NextResponse.json(
        { error: "Email or username already exists." },
        { status: 409 }
      );
    }
    console.error("❌ Register Error:", err);
    return NextResponse.json({ error: "Server error. Please try again later." }, { status: 500 });
  }
}
