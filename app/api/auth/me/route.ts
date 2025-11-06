
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { dbConnect } from "../../../src/lib/ConnectDB";
import User from "../../../src/models/users";


const COOKIE_NAME = "auth_token";

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
}

export async function GET() {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { user: null, error: "NO_TOKEN", authenticated: false },
        { status: 401 }
      );
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, getSecret());

    // Connect to database
    await dbConnect();

    // Get user ID from token
    const userId = (payload as any).id || (payload as any).sub;

    // Find user in database
    const user = await User.findById(userId)
      .select("-password") // Exclude password
      .lean();

    if (!user) {
      // User not found - clear cookie
      const res = NextResponse.json(
        { user: null, error: "USER_NOT_FOUND", authenticated: false },
        { status: 401 }
      );
      res.cookies.set(COOKIE_NAME, "", {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24, // 1 day
      });
      return res;
    }

    // Check if user is active
    if (!(user as any).isActive) {
      const res = NextResponse.json(
        { user: null, error: "ACCOUNT_DISABLED", authenticated: false },
        { status: 403 }
      );
      res.cookies.set(COOKIE_NAME, "", {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24,
      });
      return res;
    }

    // Return user data
    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          profileImage: (user as any).profileImage || null,
          createdAt: user.createdAt,
        },
        authenticated: true,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Token verification error:", err);
    
    // Token expired or invalid - clear cookie
    const res = NextResponse.json(
      { user: null, error: "TOKEN_EXPIRED_OR_INVALID", authenticated: false },
      { status: 401 }
    );
    res.cookies.set(COOKIE_NAME, "", {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24,
    });
    return res;
  }
}
