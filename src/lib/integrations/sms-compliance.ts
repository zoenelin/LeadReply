import { prisma } from "@/lib/data/prisma"

const optOutWords = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"])
const optInWords = new Set(["START", "YES", "UNSTOP"])

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "")
}

export function getSmsKeyword(body: string) {
  return body.trim().split(/\s+/)[0]?.toUpperCase() ?? ""
}

export function isOptOutKeyword(body: string) {
  return optOutWords.has(getSmsKeyword(body))
}

export function isOptInKeyword(body: string) {
  return optInWords.has(getSmsKeyword(body))
}

export async function isPhoneOptedOut(phone: string, businessId?: string) {
  const normalizedPhone = normalizePhone(phone)
  const optOut = await prisma.smsOptOut.findFirst({
    where: {
      phone: normalizedPhone,
      optedInAt: null,
      OR: businessId
        ? [
            {
              businessId,
            },
            {
              businessId: null,
            },
          ]
        : [
            {
              businessId: null,
            },
          ],
    },
  })

  return Boolean(optOut)
}

export async function recordSmsOptOut({
  phone,
  businessId,
}: {
  phone: string
  businessId?: string
}) {
  const normalizedPhone = normalizePhone(phone)

  if (!businessId) {
    const existing = await prisma.smsOptOut.findFirst({
      where: {
        businessId: null,
        phone: normalizedPhone,
      },
    })

    if (existing) {
      return prisma.smsOptOut.update({
        where: {
          id: existing.id,
        },
        data: {
          optedOutAt: new Date(),
          optedInAt: null,
        },
      })
    }

    return prisma.smsOptOut.create({
      data: {
        phone: normalizedPhone,
      },
    })
  }

  return prisma.smsOptOut.upsert({
    where: {
      businessId_phone: {
        businessId,
        phone: normalizedPhone,
      },
    },
    update: {
      optedOutAt: new Date(),
      optedInAt: null,
    },
    create: {
      businessId,
      phone: normalizedPhone,
    },
  })
}

export async function recordSmsOptIn({
  phone,
  businessId,
}: {
  phone: string
  businessId?: string
}) {
  const normalizedPhone = normalizePhone(phone)

  await prisma.smsOptOut.updateMany({
    where: {
      phone: normalizedPhone,
      ...(businessId ? { businessId } : {}),
      optedInAt: null,
    },
    data: {
      optedInAt: new Date(),
    },
  })
}
