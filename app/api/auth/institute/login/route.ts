import { loginAccount } from "../../../../src/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return loginAccount({
      role: "institute",
      email: body?.email,
      password: body?.password,
      remember: !!body?.remember,
      deviceKey: body?.deviceKey,
      userAgent: req.headers.get("user-agent") || "",
      ip:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "",
    });
  } catch (error) {
    console.error("Institute login error:", error);
    return Response.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
