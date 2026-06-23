import { z } from "zod"
import {
  adminErrorResponse,
  guardAdminMutation,
  logAdminAction,
  requireAdminSession,
} from "@/services/admin/auth"
import { createInternalClientNote } from "@/services/admin/operations"
import { internalNoteCategories } from "@/services/admin/options"

const noteSchema = z.object({
  businessId: z.string().trim().min(1, "Please select a client."),
  workerId: z.string().trim().optional().default(""),
  category: z.enum(internalNoteCategories).optional().default("GENERAL"),
  body: z.string().trim().min(1, "Please enter a note.").max(2400),
})

export async function POST(req: Request) {
  const guard = guardAdminMutation(req, "client-notes")

  if (guard) {
    return guard
  }

  const admin = await requireAdminSession()

  if ("response" in admin) {
    return admin.response
  }

  const body = await req.json().catch(() => ({}))
  const result = noteSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    )
  }

  try {
    const note = await createInternalClientNote({
      businessId: result.data.businessId,
      workerId: result.data.workerId || null,
      category: result.data.category,
      body: result.data.body,
      authorEmail: admin.session.user.email ?? "",
    })

    logAdminAction("client_note.created", {
      adminEmail: admin.session.user.email,
      noteId: note.id,
      businessId: note.businessId,
    })

    return Response.json({ note }, { status: 201 })
  } catch (error) {
    return adminErrorResponse(error, {
      action: "client_note.create",
      adminEmail: admin.session.user.email,
    })
  }
}
