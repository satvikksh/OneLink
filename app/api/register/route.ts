import { NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
import mongoose from "mongoose";

/* ========== 1️⃣ MongoDB Connection ========== */
const MONGODB_URI = process.env.MONGODB_URI || "MONGODB_URI=mongodb://127.0.0.1:27017/onelink";

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI is not defined in environment variables");
}

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    throw err;
  }
}

/* ========== 2️⃣ Define User Schema ========== */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "recruiter", "creator"],
      default: "student",
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

/* ========== 3️⃣ POST Register Route ========== */
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, username, email, password, role } = body;

    // Basic validation
    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );

    const existingUsername = await User.findOne({ username });
    if (existingUsername)
      return NextResponse.json(
        { error: "Username already taken." },
        { status: 409 }
      );

    // Hash password
    // const hashed = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      name,
      username,
      email,
      // password: hashed,
      role: role || "student",
    });

    // Return success (omit password)
    const { password: _, ...userWithoutPassword } = newUser.toObject();

    return NextResponse.json(
      { message: "User registered successfully 🎉", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Register Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
