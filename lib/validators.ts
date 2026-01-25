import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Ugyldig e-postadresse"),
  password: z.string().min(6, "Passordet må være minst 6 tegn"),
  name: z
    .string()
    .min(2, "Navn må være minst 2 tegn")
    .max(32, "Navn kan ikke være over 32 tegn"),
});

export const loginSchema = z.object({
  email: z.string().email("Ugyldig e-postadresse"),
  password: z.string().min(1, "Skriv inn passord"),
});
