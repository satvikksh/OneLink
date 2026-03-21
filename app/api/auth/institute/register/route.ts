import { NextResponse } from "next/server";
import { registerAccount } from "../../../../src/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await registerAccount({
      role: "institute",
      name: body?.name,
      email: body?.email,
      password: body?.password,
      organizationName: body?.organizationName,
      username: body?.username,
      deviceKey: body?.deviceKey,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
      {
        message: "Institute account created successfully.",
        user: result.user,
        signature: result.signature,
        redirect: "/institutes/login?registered=1",
      },
      { status: result.status }
    );
  } catch (error) {
    console.error("Institute register error:", error);
    return NextResponse.json(
      { error: "Unable to create institute account right now." },
      { status: 500 }
    );
  }
}
