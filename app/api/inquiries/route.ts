export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Inquiry from "../../src/models/inquiry";
import Institution from "../../src/models/institution";
import { dbConnect } from "../../src/lib/ConnectDB";
import { getCurrentUser } from "../../src/lib/currentUser";

function sanitizeInquiry(doc: Record<string, unknown>) {
  return {
    ...doc,
    _id: String(doc._id || ""),
    institutionId: String(doc.institutionId || ""),
    studentId: String(doc.studentId || ""),
  };
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "institute") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const institution = await Institution.findOne({
      createdBy: String(user._id),
    }).lean();

    if (!institution) {
      return NextResponse.json({ inquiries: [] }, { status: 200 });
    }

    const inquiries = await Inquiry.find({ institutionId: institution._id })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        inquiries: inquiries.map((inquiry: Record<string, unknown>) =>
          sanitizeInquiry(inquiry)
        ),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/inquiries error:", error);
    return NextResponse.json(
      { error: "Unable to load inquiries.", inquiries: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const institutionId = String(body.institutionId || "").trim();
    const message = String(body.message || "").trim();
    const preferredCourse = String(body.preferredCourse || "").trim();

    if (!institutionId || !message) {
      return NextResponse.json(
        { error: "Institution and message are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const institution = await Institution.findById(institutionId).lean();
    if (!institution) {
      return NextResponse.json(
        { error: "Selected institution was not found." },
        { status: 404 }
      );
    }

    const inquiry = await Inquiry.create({
      institutionId,
      studentId: user._id,
      studentName: user.name,
      studentEmail: user.email,
      preferredCourse,
      message,
    });

    return NextResponse.json(
      {
        inquiry: sanitizeInquiry(
          inquiry.toObject() as unknown as Record<string, unknown>
        ),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/inquiries error:", error);
    return NextResponse.json(
      { error: "Unable to send inquiry." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "institute") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    await dbConnect();

    const institution = await Institution.findOne({
      createdBy: String(user._id),
    }).lean();

    if (!institution) {
      return NextResponse.json(
        { error: "Create your institution profile before replying." },
        { status: 400 }
      );
    }

    const inquiryId = String(body.inquiryId || "").trim();
    const status = String(body.status || "replied").trim();
    const responseMessage = String(body.responseMessage || "").trim();

    if (!inquiryId) {
      return NextResponse.json({ error: "Inquiry is required." }, { status: 400 });
    }

    if (!["new", "replied", "closed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const inquiry = await Inquiry.findOneAndUpdate(
      {
        _id: inquiryId,
        institutionId: institution._id,
      },
      {
        status,
        responseMessage,
        respondedAt: responseMessage ? new Date() : null,
      },
      { new: true }
    ).lean();

    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }

    return NextResponse.json(
      { inquiry: inquiry ? sanitizeInquiry(inquiry) : null },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/inquiries error:", error);
    return NextResponse.json(
      { error: "Unable to update inquiry." },
      { status: 500 }
    );
  }
}
