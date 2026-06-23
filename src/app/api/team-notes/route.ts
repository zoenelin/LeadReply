import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { syncCustomerJobFromLead } from "@/services/crm/customer-jobs"

const teamNoteSchema = z.object({
  leadId: z.string().min(1, "Lead is required."),
  body: z.string().trim().min(1, "Please enter a note."),
})

function formatAuthorName({
  name,
  email,
}: {
  name?: string | null
  email?: string | null
}) {
  const displayName = name?.trim()

  if (displayName) {
    return displayName
  }

  const emailName = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim()

  if (emailName) {
    return emailName
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  }

  return "Team"
}

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageLeads", req)

  if ("response" in auth) {
    return auth.response
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
        businessId: auth.access.businessId,
      },
      include: {
        job: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!lead) {
      return Response.json({ error: "Lead not found." }, { status: 404 })
    }

    const authorName = formatAuthorName({
      name: auth.session.user.name,
      email: auth.session.user.email,
    })
    const note = await prisma.$transaction(async (tx) => {
      let customerId = lead.customerId
      let jobId = lead.job?.id ?? null

      if (!customerId || !jobId) {
        const synced = await syncCustomerJobFromLead(tx, lead)
        customerId = synced.customer.id
        jobId = synced.job.id
      }

      const createdNote = await tx.teamNote.create({
        data: {
          leadId: lead.id,
          businessId: lead.businessId,
          body: result.data.body,
          authorName,
        },
      })

      await tx.customerActivity.create({
        data: {
          businessId: lead.businessId,
          customerId,
          jobId,
          leadId: lead.id,
          type: "NOTE",
          title: "Note added",
          body: result.data.body,
          authorName,
          source: "TEAM_NOTE",
        },
      })

      return createdNote
    })

    return Response.json({ note }, { status: 201 })
  } catch {
    return Response.json(
      { error: "Something went wrong saving the note." },
      { status: 500 }
    )
  }
}
