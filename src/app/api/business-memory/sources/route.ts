import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import {
  businessMemorySourceTextLimit,
  businessMemorySourceTypes,
  extractBusinessMemoryDrafts,
} from "@/services/business-memory/memory"
import { requireApiBusinessAccess } from "@/services/auth/business-access"
import { rejectCrossSiteRequest } from "@/services/security/request-security"

const sourceTypeValues = businessMemorySourceTypes.map((source) => source.value) as [
  string,
  ...string[],
]

const sourceSchema = z.object({
  sourceType: z.enum(sourceTypeValues),
  sourceName: z.string().trim().max(160).optional().default(""),
  rawText: z
    .string()
    .trim()
    .min(20, "Paste at least a few lines of business information.")
    .max(
      businessMemorySourceTextLimit,
      "Keep each source import under 250,000 characters for now."
    ),
})

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageAutomation", req)

  if ("response" in auth) {
    return auth.response
  }

  try {
    const body = await req.json()
    const result = sourceSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const business = await prisma.business.findUnique({
      where: {
        id: auth.access.businessId,
      },
      select: {
        id: true,
      },
    })

    if (!business) {
      return Response.json({ error: "Business not found." }, { status: 404 })
    }

    const drafts = extractBusinessMemoryDrafts(result.data.rawText)

    if (drafts.length === 0) {
      return Response.json(
        { error: "LeadReply could not find clear business facts in that text." },
        { status: 400 }
      )
    }

    const imported = await prisma.$transaction(async (tx) => {
      const source = await tx.businessMemorySource.create({
        data: {
          businessId: business.id,
          sourceType: result.data.sourceType,
          sourceName: result.data.sourceName,
          rawText: result.data.rawText,
          status: "IMPORTED",
        },
      })

      const items = await Promise.all(
        drafts.map((draft) =>
          tx.businessMemoryItem.create({
            data: {
              businessId: business.id,
              sourceId: source.id,
              sourceType: source.sourceType,
              sourceName: source.sourceName,
              category: draft.category,
              title: draft.title,
              content: draft.content,
              confidence: draft.confidence,
              status: "NEEDS_REVIEW",
            },
          })
        )
      )

      return {
        source,
        items,
      }
    })

    return Response.json(imported)
  } catch {
    return Response.json(
      { error: "Something went wrong importing business memory." },
      { status: 500 }
    )
  }
}
