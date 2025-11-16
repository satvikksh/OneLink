// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionBySignedToken } from "./src/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // protect /dashboard/* as example
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/app")) {
    const signed = req.cookies.get("session_id")?.value;
    const session = await getSessionBySignedToken(signed);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    // continue (you can attach headers or rewrite to include user id)
    return NextResponse.next();
  }
  return NextResponse.next();
}

// configure matcher if desired
export const config = {
  matcher: ["/dashboard/:path*", "/app/:path*"],
};
