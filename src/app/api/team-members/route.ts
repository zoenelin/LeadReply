import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { businessRoles } from "@/lib/security/permissions"
import { requireApiOwnerBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const teamMemberSchema = z.object({
  name: z.string().trim().optional().default(""),
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(businessRoles),
})

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiOwnerBusinessAccess(req)

  if ("response" in auth) {
    return auth.response
  }

  const body = await req.json().catch(() => ({}))
  const result = teamMemberSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  try {
    const member = await prisma.teamMember.create({
      data: {
        businessId: auth.access.businessId,
        name: result.data.name,
        email: result.data.email.toLowerCase().trim(),
        role: result.data.role,
      },
    })

    return Response.json({ member }, { status: 201 })
  } catch {
    return Response.json(
      { error: "That team member may already exist." },
      { status: 400 }
    )
  }
}
