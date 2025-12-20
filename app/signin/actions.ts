"use server";

import { signInSchema, signUpSchema } from "./validation";
import { z } from "zod";

export type ValidationResult =
  | { success: true }
  | { success: false; errors: Record<string, string> };

export const validateSignIn = async (
  data: unknown
): Promise<ValidationResult> => {
  const result = signInSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) {
        errors[err.path[0] as string] = err.message;
      }
    });
    return { success: false, errors };
  }
  return { success: true };
};

export const validateSignUp = async (
  data: unknown
): Promise<ValidationResult> => {
  const result = signUpSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) {
        errors[err.path[0] as string] = err.message;
      }
    });
    return { success: false, errors };
  }
  return { success: true };
};
