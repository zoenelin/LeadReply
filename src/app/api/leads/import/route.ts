import { createHash } from "node:crypto"
import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { getLeadImportPreview } from "@/services/jobs/lead-import-job"
import { QueueUnavailableError } from "@/services/queue/client"
import { enqueueOpsJob } from "@/services/queue/jobs"
import { requireApiBusinessAccess } from "@/services/auth/business-access"

const importSchema = z.object({
  csv: z.string().min(1, "Please paste CSV content."),
})

export async function POST(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageLeads", req)

  if ("response" in auth) {
    return auth.response
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

  const body = await req.json().catch(() => ({}))
  const result = importSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  const preview = getLeadImportPreview(result.data.csv)

  if (preview.validRows === 0) {
    return Response.json(
      { error: "No valid leads found. Include at least name and phone columns." },
      { status: 400 }
    )
  }

  try {
    const csvHash = createHash("sha256").update(result.data.csv).digest("hex")
    const { jobRun, deduped } = await enqueueOpsJob({
      type: "LEAD_IMPORT",
      name: `Lead import for ${preview.validRows} row${
        preview.validRows === 1 ? "" : "s"
      }`,
      businessId: business.id,
      source: auth.access.isOwner ? "OWNER" : "TEAM",
      details: `CSV import with ${preview.validRows} valid row${
        preview.validRows === 1 ? "" : "s"
      } and ${preview.skippedRows} skipped row${
        preview.skippedRows === 1 ? "" : "s"
      }.`,
      payload: {
        businessId: business.id,
        csv: result.data.csv,
        totalRows: preview.totalRows,
        validRows: preview.validRows,
      },
      dedupeKey: `lead-import:${business.id}:${csvHash}`,
      maxAttempts: 2,
    })

    return Response.json(
      {
        job: jobRun,
        deduped,
        preview,
        message: deduped
          ? "This exact import is already queued or completed."
          : "Lead import queued. The worker will process the CSV in the background.",
      },
      { status: 202 }
    )
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong queueing the import.",
      },
      { status: error instanceof QueueUnavailableError ? 503 : 500 }
    )
  }
}
