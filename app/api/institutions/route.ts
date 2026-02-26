export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "../../src/lib/ConnectDB";
import Institution from "../../src/models/institution";
import { getSessionBySignedToken } from "../../src/lib/session";

const COOKIE_NAME = "session_id";

async function getCurrentUserId() {
  const jar = cookies();
  const signed = (await jar).get(COOKIE_NAME)?.value;
  if (!signed) return null;
  const session = await getSessionBySignedToken(signed);
  if (!session) return null;
  return String((session.user as any)?._id || session.user);
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const institutions = await Institution.find({})
      .sort({ createdAt: -1 })
      .lean()
      .catch(() => []);

    return NextResponse.json({ institutions }, { status: 200 });
  } catch (err) {
    console.error("GET /api/institutions error:", err);
    return NextResponse.json({ error: "Server error", institutions: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const nowYear = new Date().getFullYear();
    const establishedYear = Number(body.establishedYear);
    const totalStudents = Number(body.totalStudents);

    const required = [
      body.institutionType,
      body.name,
      body.email,
      body.phone,
      body.addressLine1,
      body.city,
      body.state,
      body.country,
      body.zipCode,
      body.headName,
      body.description,
    ];

    if (required.some((v) => !String(v || "").trim())) {
      return NextResponse.json({ error: "Please fill all required fields" }, { status: 400 });
    }

    if (!["college", "school"].includes(String(body.institutionType))) {
      return NextResponse.json({ error: "Invalid institution type" }, { status: 400 });
    }

    if (!Number.isFinite(establishedYear) || establishedYear < 1500 || establishedYear > nowYear) {
      return NextResponse.json({ error: "Invalid established year" }, { status: 400 });
    }

    if (!Number.isFinite(totalStudents) || totalStudents < 0) {
      return NextResponse.json({ error: "Invalid student count" }, { status: 400 });
    }

    const email = String(body.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const parseList = (v: unknown) =>
      String(v || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    await dbConnect();

    const created = await Institution.create({
      institutionType: String(body.institutionType),
      name: String(body.name).trim(),
      email,
      phone: String(body.phone).trim(),
      website: String(body.website || "").trim(),
      addressLine1: String(body.addressLine1).trim(),
      addressLine2: String(body.addressLine2 || "").trim(),
      city: String(body.city).trim(),
      state: String(body.state).trim(),
      country: String(body.country).trim(),
      zipCode: String(body.zipCode).trim(),
      establishedYear,
      headName: String(body.headName).trim(),
      totalStudents,
      accreditation: String(body.accreditation || "").trim(),
      courses: parseList(body.courses),
      facilities: parseList(body.facilities),
      description: String(body.description).trim(),
      createdBy: userId,
    });

    return NextResponse.json({ ok: true, institution: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/institutions error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
