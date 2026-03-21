import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import User from "../models/users";
import { generateSignature, sanitizeDeviceKey } from "./device";
import { createSession, signSessionToken } from "./session";
import { dbConnect } from "./ConnectDB";

type AccountRole = "student" | "institute";

type RegisterAccountArgs = {
  role: AccountRole;
  name: string;
  email: string;
  password: string;
  organizationName?: string;
  username?: string;
  deviceKey?: string | null;
};

type LoginAccountArgs = {
  role: AccountRole;
  email: string;
  password: string;
  remember?: boolean;
  deviceKey?: string | null;
  userAgent?: string;
  ip?: string;
};

const AUTH_COOKIE = "auth_token";
const SESSION_COOKIE = "session_id";
const DEVICE_COOKIE = "device_key";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || "default_secret";
  return new TextEncoder().encode(secret);
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);

const sanitizeUser = (user: Record<string, unknown>) => {
  const next = { ...user };
  delete next.password;
  delete next.signature;
  return next;
};

let signatureIndexChecked = false;

async function ensureSignatureIndexRelaxed() {
  if (signatureIndexChecked) return;

  try {
    const indexes = await User.collection.indexes();
    const signatureIndex = indexes.find((index) => index.name === "signature_1");

    if (signatureIndex?.unique) {
      await User.collection.dropIndex("signature_1");
    }
  } catch (error: any) {
    const message = String(error?.message || "");
    const namespaceMissing =
      error?.codeName === "NamespaceNotFound" ||
      message.includes("ns not found");

    if (!namespaceMissing && error?.code !== 27) {
      console.warn("[auth] unable to relax signature index:", error);
    }
  } finally {
    signatureIndexChecked = true;
  }
}

async function generateUniqueUsername(seed: string) {
  const base = slugify(seed) || "learner";
  let candidate = base.slice(0, 20);
  let counter = 0;

  while (counter < 25) {
    const existing = await User.findOne({ username: candidate }).lean();
    if (!existing) return candidate;

    counter += 1;
    const suffix = counter.toString();
    const maxBaseLength = Math.max(3, 20 - suffix.length - 1);
    candidate = `${base.slice(0, maxBaseLength)}-${suffix}`;
  }

  return `${base.slice(0, 12)}-${Date.now().toString(36).slice(-6)}`;
}

function applyAuthCookies(
  response: NextResponse,
  params: {
    jwtToken: string;
    signedSessionCookie: string;
    deviceKey: string;
    maxAgeSec: number;
  }
) {
  const { jwtToken, signedSessionCookie, deviceKey, maxAgeSec } = params;

  response.cookies.set(AUTH_COOKIE, jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  });

  response.cookies.set(SESSION_COOKIE, signedSessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  });

  response.cookies.set(DEVICE_COOKIE, deviceKey, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  });
}

export async function registerAccount({
  role,
  name,
  email,
  password,
  organizationName,
  username,
  deviceKey,
}: RegisterAccountArgs) {
  await dbConnect();
  await ensureSignatureIndexRelaxed();

  const normalizedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedOrganizationName = String(organizationName || "").trim();
  const normalizedDeviceKey = sanitizeDeviceKey(deviceKey) || generateSignature();

  if (!normalizedName || !normalizedEmail || !password) {
    return {
      ok: false as const,
      status: 400,
      error: "Please complete all required fields.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return {
      ok: false as const,
      status: 400,
      error: "Enter a valid email address.",
    };
  }

  if (password.length < 8) {
    return {
      ok: false as const,
      status: 400,
      error: "Password must be at least 8 characters long.",
    };
  }

  if (role === "institute" && !normalizedOrganizationName) {
    return {
      ok: false as const,
      status: 400,
      error: "Institute name is required.",
    };
  }

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    return {
      ok: false as const,
      status: 409,
      error: "An account with this email already exists.",
    };
  }

  const resolvedUsername =
    username && slugify(username).length >= 3
      ? slugify(username)
      : await generateUniqueUsername(normalizedOrganizationName || normalizedName);

  const usernameTaken = await User.findOne({ username: resolvedUsername }).lean();
  if (usernameTaken) {
    return {
      ok: false as const,
      status: 409,
      error: "Please try again. We could not reserve a unique account handle.",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let created;

  try {
    created = await User.create({
      name: normalizedName,
      username: resolvedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      organizationName: normalizedOrganizationName || null,
      signature: normalizedDeviceKey,
    });
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.signature) {
      created = await User.create({
        name: normalizedName,
        username: resolvedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        organizationName: normalizedOrganizationName || null,
        signature: null,
      });
    } else {
      throw error;
    }
  }

  const user = sanitizeUser(
    created.toObject
      ? (created.toObject() as unknown as Record<string, unknown>)
      : (created as unknown as Record<string, unknown>)
  );

  return {
    ok: true as const,
    status: 201,
    user,
    signature: normalizedDeviceKey,
  };
}

export async function loginAccount({
  role,
  email,
  password,
  remember,
  deviceKey,
  userAgent,
  ip,
}: LoginAccountArgs) {
  await dbConnect();
  await ensureSignatureIndexRelaxed();

  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedDeviceKey = sanitizeDeviceKey(deviceKey);

  if (!normalizedEmail || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password +signature"
  );

  if (!user || user.role !== role) {
    return NextResponse.json(
      {
        error:
          role === "student"
            ? "Student account not found for these credentials."
            : "Institute account not found for these credentials.",
      },
      { status: 401 }
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  if (!user.signature) {
    user.signature = normalizedDeviceKey || generateSignature();
    try {
      await user.save();
    } catch (error: any) {
      if (error?.code === 11000 && error?.keyPattern?.signature) {
        user.signature = null;
      } else {
        throw error;
      }
    }
  }

  const resolvedDeviceKey = user.signature || normalizedDeviceKey || generateSignature();
  const maxAgeSec = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

  const jwtToken = await new SignJWT({
    id: String(user._id),
    email: user.email,
    role: user.role,
    username: user.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(getJwtSecret());

  const sessionDoc = await createSession({
    userId: String(user._id),
    deviceKey: resolvedDeviceKey,
    ua: userAgent,
    ip,
    maxAgeSec,
  });

  const signedSessionCookie = await signSessionToken({
    sid: sessionDoc.sid,
    uid: String(user._id),
    maxAgeSec,
  });

  const response = NextResponse.json(
    {
      message:
        role === "student"
          ? "Student login successful."
          : "Institute login successful.",
      user: sanitizeUser(user.toObject() as unknown as Record<string, unknown>),
      signature: resolvedDeviceKey,
      redirect: role === "student" ? "/students/discover" : "/institutes/dashboard",
    },
    { status: 200 }
  );

  applyAuthCookies(response, {
    jwtToken,
    signedSessionCookie,
    deviceKey: resolvedDeviceKey,
    maxAgeSec,
  });

  response.headers.set("Cache-Control", "no-store");
  return response;
}
