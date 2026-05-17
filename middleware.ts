import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/students/discover") ||
    pathname.startsWith("/institutes/dashboard")
  ) {
    const signed = req.cookies.get("session_id")?.value;
    const deviceKey = req.cookies.get("device_key")?.value;

    if (!signed || !deviceKey) {
      const url = req.nextUrl.clone();
      url.pathname = pathname.startsWith("/institutes")
        ? "/institutes/login"
        : "/students/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/students/discover/:path*", "/institutes/dashboard/:path*"],
};
