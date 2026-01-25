import { cookies } from "next/headers";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

export async function getSession() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  const userId = typeof payload.sub === "string" ? payload.sub : null;
  const email = typeof payload.email === "string" ? payload.email : null;
  const name = typeof payload.name === "string" ? payload.name : null;

  if (!userId || !email || !name) return null;
  return { userId, email, name };
}
