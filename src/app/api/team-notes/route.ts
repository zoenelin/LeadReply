import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"

const teamNoteSchema = z.object({
  leadId: z.string().min(1, "Lead is required."),
  body: z.string().trim().min(1, "Please enter a note."),
  authorName: z.string().trim().optional().default("Team"),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    const body = await req.json()
    const result = teamNoteSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: result.data.leadId,
        business: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        businessId: true,
      },
    })

    if (!lead) {
      return Response.json({ error: "Lead not found." }, { status: 404 })
    }

    const note = await prisma.teamNote.create({
      data: {
        leadId: lead.id,
        businessId: lead.businessId,
        body: result.data.body,
        authorName: result.data.authorName || "Team",
      },
    })

    return Response.json({ note }, { status: 201 })
  } catch {
    return Response.json(
      { error: "Something went wrong saving the note." },
      { status: 500 }
    )
  }
}
