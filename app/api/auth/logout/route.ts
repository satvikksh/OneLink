import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logout successful" }, { status: 200 });

  // delete cookie (agar cookie-based login use karte ho)
  res.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });

  return res;
}
