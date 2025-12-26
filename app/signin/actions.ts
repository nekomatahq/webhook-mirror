"use server";

import { signInSchema, signUpSchema } from "./validation";
import { ZodError } from "zod";

export type ValidationResult =
  | { success: true }
  | { success: false; errors: Record<string, string> };

const extractErrors = (error: ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    if (issue.path && typeof issue.path[0] === "string") {
      errors[issue.path[0]] = issue.message;
    }
  }
  return errors;
};

export const validateSignIn = async (
  data: unknown
): Promise<ValidationResult> => {
  const result = signInSchema.safeParse(data);
  if (!result.success) {
    return { success: false, errors: extractErrors(result.error) };
  }
  return { success: true };
};

export const validateSignUp = async (
  data: unknown
): Promise<ValidationResult> => {
  const result = signUpSchema.safeParse(data);
  if (!result.success) {
    return { success: false, errors: extractErrors(result.error) };
  }
  return { success: true };
};
