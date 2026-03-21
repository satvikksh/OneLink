import { cookies } from "next/headers";
import User from "../models/users";
import { dbConnect } from "./ConnectDB";
import { getSessionBySignedToken } from "./session";

export async function getCurrentUser(req?: Request) {
  await dbConnect();

  const jar = await cookies();
  const signedSession = jar.get("session_id")?.value || null;
  const deviceKey =
    req?.headers.get("x-device-key") || jar.get("device_key")?.value || null;

  if (!signedSession) return null;

  const session = await getSessionBySignedToken(signedSession, deviceKey);
  if (!session) return null;

  const userId =
    session.user && typeof session.user === "object" && "_id" in session.user
      ? String((session.user as { _id: string })._id)
      : String(session.user);

  return User.findById(userId).select("-password -signature").lean();
}
