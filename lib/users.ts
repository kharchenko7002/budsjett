import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

export async function createUser(email: string, name: string, password: string) {
  const normalizedEmail = email.toLowerCase();

  const exists = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (exists) throw new Error("USER_EXISTS");

  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      passwordHash,
    },
    select: { id: true, email: true, name: true },
  });
}

export async function verifyUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, name: true, passwordHash: true },
  });

  if (!user) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return { id: user.id, email: user.email, name: user.name };
}
