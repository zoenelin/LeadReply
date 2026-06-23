import { prisma } from "@/lib/data/prisma"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { requireApiBusinessAccess } from "@/services/auth/business-access"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(_req)

  if (crossSite) {
    return crossSite
  }

  const auth = await requireApiBusinessAccess("manageLeads", _req)

  if ("response" in auth) {
    return auth.response
  }

  const { id } = await params
  const note = await prisma.teamNote.findFirst({
    where: {
      id,
      businessId: auth.access.businessId,
    },
  })

  if (!note) {
    return Response.json({ error: "Note not found." }, { status: 404 })
  }

  try {
    await prisma.teamNote.delete({
      where: {
        id,
      },
    })

    return Response.json({ message: "Note deleted." })
  } catch {
    return Response.json(
      { error: "Something went wrong deleting the note." },
      { status: 500 }
    )
  }
}
