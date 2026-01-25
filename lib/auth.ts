import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE = "auth_token";

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
};

function getSecret() {
  const secret = process.env.JWT_SECRET || "dev-secret-bytt-meg";
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: JwtPayload) {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}
