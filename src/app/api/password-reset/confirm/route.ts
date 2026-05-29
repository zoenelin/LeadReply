import { createHash } from "node:crypto"
import bcrypt from "bcrypt"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

const confirmSchema = z.object({
  token: z.string().min(32, "Reset token is missing."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long.")
    .regex(/[A-Za-z]/, "Password must include at least one letter.")
    .regex(/[0-9]/, "Password must include at least one number."),
})

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const body = await req.json().catch(() => ({}))
  const result = confirmSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: {
      tokenHash: hashToken(result.data.token),
    },
  })

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt.getTime() < Date.now()
  ) {
    return Response.json(
      { error: "This reset link is invalid or expired." },
      { status: 400 }
    )
  }

  const hashedPassword = await bcrypt.hash(result.data.password, 10)

  await prisma.$transaction([
    prisma.user.update({
      where: {
        email: resetToken.email,
      },
      data: {
        password: hashedPassword,
      },
    }),
    prisma.passwordResetToken.update({
      where: {
        id: resetToken.id,
      },
      data: {
        usedAt: new Date(),
      },
    }),
  ])

  return Response.json({
    message: "Password updated. You can log in with the new password.",
  })
}
