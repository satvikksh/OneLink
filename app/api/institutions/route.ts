export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Institution from "../../src/models/institution";
import { dbConnect } from "../../src/lib/ConnectDB";
import { getCurrentUser } from "../../src/lib/currentUser";

const parseList = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    : String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

const sanitizeGallery = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      kind: item?.kind === "video" ? "video" : "image",
      url: String(item?.url || "").trim(),
      caption: String(item?.caption || "").trim(),
    }))
    .filter((item) => item.url);
};

function sanitizeInstitution(doc: Record<string, unknown>) {
  const next: Record<string, unknown> = {
    ...doc,
    _id: String(doc._id || ""),
    gallery: Array.isArray(doc.gallery)
      ? doc.gallery.map((item) => ({
          kind: item?.kind === "video" ? "video" : "image",
          url: String(item?.url || ""),
          caption: String(item?.caption || ""),
        }))
      : [],
  };
  delete next.createdBy;
  return next;
}

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine");

    if (mine === "1") {
      const user = await getCurrentUser(req);
      if (!user || user.role !== "institute") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const institution = await Institution.findOne({
        createdBy: String(user._id),
      })
        .sort({ updatedAt: -1 })
        .lean();

      return NextResponse.json(
        { institution: institution ? sanitizeInstitution(institution) : null },
        { status: 200 }
      );
    }

    const type = searchParams.get("type");
    const location = searchParams.get("location");
    const course = searchParams.get("course");
    const facility = searchParams.get("facility");
    const search = searchParams.get("search");
    const maxFees = Number(searchParams.get("maxFees"));
    const minRating = Number(searchParams.get("minRating"));

    const query: Record<string, unknown> = {};

    if (type && ["college", "school"].includes(type)) {
      query.institutionType = type;
    }

    if (!Number.isNaN(maxFees) && maxFees > 0) {
      query.annualFees = { $lte: maxFees };
    }

    if (!Number.isNaN(minRating) && minRating > 0) {
      query.rating = { $gte: minRating };
    }

    if (course) {
      query.courses = {
        $elemMatch: { $regex: course, $options: "i" },
      };
    }

    if (facility) {
      query.facilities = {
        $elemMatch: { $regex: facility, $options: "i" },
      };
    }

    const searchClauses = [location, search]
      .filter(Boolean)
      .flatMap((value) => [
        { name: { $regex: value, $options: "i" } },
        { city: { $regex: value, $options: "i" } },
        { state: { $regex: value, $options: "i" } },
        { country: { $regex: value, $options: "i" } },
        { description: { $regex: value, $options: "i" } },
      ]);

    if (searchClauses.length) {
      query.$or = searchClauses;
    }

    const institutions = await Institution.find(query)
      .sort({ rating: -1, updatedAt: -1 })
      .lean();

    return NextResponse.json(
      {
        institutions: institutions.map((institution: Record<string, unknown>) =>
          sanitizeInstitution(institution)
        ),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/institutions error:", error);
    return NextResponse.json(
      { error: "Unable to load institutions.", institutions: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "institute") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const nowYear = new Date().getFullYear();
    const establishedYear = Number(body.establishedYear);
    const totalStudents = Number(body.totalStudents);
    const annualFees = Number(body.annualFees || 0);
    const rating = Number(body.rating || 0);

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

    if (required.some((value) => !String(value || "").trim())) {
      return NextResponse.json(
        { error: "Please fill all required fields." },
        { status: 400 }
      );
    }

    if (!["college", "school"].includes(String(body.institutionType))) {
      return NextResponse.json(
        { error: "Invalid institution type." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(establishedYear) ||
      establishedYear < 1500 ||
      establishedYear > nowYear
    ) {
      return NextResponse.json(
        { error: "Invalid established year." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(totalStudents) || totalStudents < 0) {
      return NextResponse.json(
        { error: "Invalid student count." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(annualFees) || annualFees < 0) {
      return NextResponse.json(
        { error: "Invalid fee amount." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 0 and 5." },
        { status: 400 }
      );
    }

    const email = String(body.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    await dbConnect();

    const institution = await Institution.findOneAndUpdate(
      { createdBy: String(user._id) },
      {
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
        annualFees,
        rating,
        accreditation: String(body.accreditation || "").trim(),
        courses: parseList(body.courses),
        facilities: parseList(body.facilities),
        description: String(body.description).trim(),
        infrastructure: String(body.infrastructure || "").trim(),
        faculty: String(body.faculty || "").trim(),
        gallery: sanitizeGallery(body.gallery),
        createdBy: String(user._id),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return NextResponse.json(
      {
        ok: true,
        institution: institution ? sanitizeInstitution(institution) : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/institutions error:", error);
    return NextResponse.json(
      { error: "Unable to save institution profile." },
      { status: 500 }
    );
  }
}
