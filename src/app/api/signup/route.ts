import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import { z } from "zod"

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long.")
    .regex(/[A-Za-z]/, "Password must include at least one letter.")
    .regex(/[0-9]/, "Password must include at least one number."),
  businessName: z.string().min(1, "Please enter your business name."),
  businessPhone: z.string().min(1, "Please enter your business phone number."),
  businessType: z.enum(["HOME_SERVICES", "BEAUTY_SERVICES", "FOOD_SERVICES"]),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const result = signupSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      )
    }

    const { email, password, businessName, businessPhone, businessType } =
      result.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return Response.json(
        { error: "An account with that email already exists." },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        business: {
          create: {
            name: businessName,
            phone: businessPhone,
            businessType,
          },
        },
      },
      include: {
        business: true,
      },
    })

    return Response.json(
      {
        message: "Account created successfully.",
        user: {
          id: user.id,
          email: user.email,
          business: user.business,
        },
      },
      { status: 201 }
    )
  } catch {
    return Response.json(
      { error: "Something went wrong creating the account." },
      { status: 500 }
    )
  }
}
