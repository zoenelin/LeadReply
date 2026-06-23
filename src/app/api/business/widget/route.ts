import { z } from "zod"
import { prisma } from "@/lib/data/prisma"
import { rejectCrossSiteRequest } from "@/services/security/request-security"
import { requireApiBusinessAccess } from "@/services/auth/business-access"

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

  const auth = await requireApiBusinessAccess("manageAutomation", req)

  if ("response" in auth) {
    return auth.response
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
        id: auth.access.businessId,
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
