import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../src/lib/currentUser";

function serializeUser(user: Record<string, unknown>) {
  return {
    ...user,
    _id: String(user._id || ""),
  };
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      const response = NextResponse.json(
        { user: null, error: "NO_SESSION" },
        { status: 401 }
      );
      response.cookies.set("session_id", "", {
        path: "/",
        httpOnly: true,
        maxAge: 0,
      });
      response.cookies.set("auth_token", "", {
        path: "/",
        httpOnly: true,
        maxAge: 0,
      });
      response.cookies.set("device_key", "", {
        path: "/",
        maxAge: 0,
      });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    const response = NextResponse.json(
      { user: serializeUser(user as Record<string, unknown>) },
      { status: 200 }
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("/api/auth/me error:", error);
    return NextResponse.json(
      { user: null, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
