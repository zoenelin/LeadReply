import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { rejectCrossSiteRequest } from "@/lib/request-security"

const widgetSchema = z.object({
  widgetGreeting: z
    .string()
    .trim()
    .min(10, "Greeting should be at least 10 characters.")
    .max(180, "Greeting should be 180 characters or fewer."),
  widgetPrimaryAction: z.enum(["CALLBACK", "TEXT"]),
  widgetAccentColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Please enter a hex color like #0f172a."),
})

export async function PUT(req: Request) {
  const crossSite = rejectCrossSiteRequest(req)

  if (crossSite) {
    return crossSite
  }

  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    const body = await req.json()
    const result = widgetSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const business = await prisma.business.update({
      where: {
        userId: session.user.id,
      },
      data: result.data,
    })

    return Response.json({ business })
  } catch {
    return Response.json(
      { error: "Something went wrong saving the widget." },
      { status: 500 }
    )
  }
}
