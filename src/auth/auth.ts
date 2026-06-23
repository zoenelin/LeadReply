import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/data/prisma"
import { checkRateLimit } from "@/services/security/rate-limit"

function readHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getLoginRateLimitKey({
  email,
  headers,
}: {
  email: string
  headers?: Record<string, string | string[] | undefined>
}) {
  const forwardedFor = readHeaderValue(headers?.["x-forwarded-for"])
  const realIp = readHeaderValue(headers?.["x-real-ip"])
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown"

  return `login:${ip}:${email.toLowerCase().trim()}`
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.toLowerCase().trim()
        const rateLimit = checkRateLimit({
          key: getLoginRateLimitKey({
            email,
            headers: req.headers,
          }),
          limit: 10,
          windowMs: 15 * 60 * 1000,
        })

        if (!rateLimit.allowed) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user) {
          return null
        }

        const passwordMatches = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!passwordMatches) {
          return null
        }

        return {
          id: user.id,
          email: user.email
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}

export default NextAuth(authOptions)
