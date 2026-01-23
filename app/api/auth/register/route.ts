import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validators";
import { createUser } from "@/lib/users";
import { AUTH_COOKIE, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email, name, password } = parsed.data;
    const user = await createUser(email, name, password);

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
  } catch (e: any) {
    if (e?.message === "USER_EXISTS") {
      return NextResponse.json({ error: "Brukeren finnes allerede" }, { status: 409 });
    }
    return NextResponse.json({ error: "Serverfeil" }, { status: 500 });
  }
}
