import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/data/prisma"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const appearanceSchema = z.object({
  themePreference: z.enum(["LIGHT", "DARK"]),
})

export async function PATCH(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const result = appearanceSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const user = await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      themePreference: result.data.themePreference,
    },
    select: {
      themePreference: true,
    },
  })

  return Response.json({ user })
}
