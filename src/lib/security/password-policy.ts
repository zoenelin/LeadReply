import { z } from "zod"

export const passwordMinLength = 8
export const passwordMaxLength = 72

export const passwordHelpText =
  "Use 8 to 72 characters. Passphrases and password managers are supported."

export const passwordSchema = z
  .string()
  .min(passwordMinLength, "Password must be at least 8 characters.")
  .max(passwordMaxLength, "Password must be 72 characters or fewer.")
