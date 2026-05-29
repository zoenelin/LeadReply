import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

const teamMemberSchema = z.object({
  name: z.string().trim().optional().default(""),
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(["OWNER", "MANAGER", "STAFF", "VIEWER"]),
})

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const business = await prisma.business.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  })

  if (!business) {
    return Response.json({ error: "Business not found." }, { status: 404 })
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
        businessId: business.id,
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
