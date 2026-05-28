import { getServerSession } from "next-auth"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSite = rejectCrossSiteRequest(_req)

  if (crossSite) {
    return crossSite
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params
  const note = await prisma.teamNote.findFirst({
    where: {
      id,
      business: {
        userId: session.user.id,
      },
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
