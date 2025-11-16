import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "../../../src/lib/ConnectDB";
import User from "../../../src/models/users";
import { generateSignature } from "../../../src/lib/device";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    let { name, username, email, password, role, deviceKey } = body || {};

    // Normalize data
    name = (name || "").trim();
    username = (username || "").trim().toLowerCase();
    email = (email || "").trim().toLowerCase();

    // Validate fields
    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    // Duplicate check
    const existing = await User.findOne({ 
      $or: [{ email }, { username }] 
    }).lean();

    if (existing) {
      let msg =
        existing.email === email
          ? "Email already registered."
          : "Username already taken.";

      return NextResponse.json({ error: msg }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set signature (deviceKey or random)
    const signature = deviceKey || generateSignature();

    // Create new user
    const created = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role: role || "student",
      signature,
    });

    const userObj = created.toObject();
(userObj as any).password = undefined;

    return NextResponse.json(
      {
        message: "User registered successfully 🎉",
        user: userObj,
        signature,
        redirect: "/login",
      },
      { status: 201 }
    );
  } catch (err: any) {
    // MongoDB duplicate key error
    if (err?.code === 11000) {
      return NextResponse.json(
        { error: "Email or username already exists." },
        { status: 409 }
      );
    }

    console.error("❌ Register Error:", err);
    return NextResponse.json(
      { error: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}
