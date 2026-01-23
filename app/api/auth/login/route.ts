import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators";
import { verifyUser } from "@/lib/users";
import { AUTH_COOKIE, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await verifyUser(email, password);

  if (!user) {
    return NextResponse.json({ error: "Feil e-post eller passord" }, { status: 401 });
  }

  const token = signToken({ sub: user.id, email: user.email, name: user.name });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
