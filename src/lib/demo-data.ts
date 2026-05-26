const averageLeadValues: Record<string, number> = {
  AUTOMOTIVE: 42000,
  HOME_SERVICES: 65000,
  BEAUTY_SERVICES: 12000,
  FOOD_SERVICES: 18000,
  MEDICAL_WELLNESS: 26000,
  LEGAL: 90000,
  FITNESS: 16000,
  REAL_ESTATE: 120000,
  PROFESSIONAL_SERVICES: 75000,
  RETAIL: 14000,
  OTHER: 30000,
}

const seedCallsByType = {
  AUTOMOTIVE: [
    {
      callerName: "Jamie Parker",
      callerPhone: "(555) 214-9021",
      reason: "Asked about a brake inspection and same-week availability.",
    },
    {
      callerName: "Morgan Lee",
      callerPhone: "(555) 782-1140",
      reason: "Wanted an estimate for engine diagnostics.",
    },
    {
      callerName: "Taylor Smith",
      callerPhone: "(555) 640-3318",
      reason: "Called about oil change pricing and drop-off times.",
    },
  ],
  HOME_SERVICES: [
    {
      callerName: "Jamie Parker",
      callerPhone: "(555) 214-9021",
      reason: "Asked about a same-week estimate for a leaking sink.",
    },
    {
      callerName: "Morgan Lee",
      callerPhone: "(555) 782-1140",
      reason: "Wanted availability for a small repair before Friday.",
    },
    {
      callerName: "Taylor Smith",
      callerPhone: "(555) 640-3318",
      reason: "Called about service area and pricing for a new job.",
    },
  ],
  BEAUTY_SERVICES: [
    {
      callerName: "Ari Johnson",
      callerPhone: "(555) 418-2904",
      reason: "Asked about openings for a haircut this afternoon.",
    },
    {
      callerName: "Casey Nguyen",
      callerPhone: "(555) 906-4412",
      reason: "Wanted pricing and availability for a full set.",
    },
    {
      callerName: "Riley Carter",
      callerPhone: "(555) 335-7729",
      reason: "Called to ask if walk-ins are available today.",
    },
  ],
  FOOD_SERVICES: [
    {
      callerName: "Chris Rivera",
      callerPhone: "(555) 829-1044",
      reason: "Asked about catering for a lunch order tomorrow.",
    },
    {
      callerName: "Sam Brooks",
      callerPhone: "(555) 503-6671",
      reason: "Wanted to confirm reservation availability for six people.",
    },
    {
      callerName: "Jordan Kim",
      callerPhone: "(555) 721-8840",
      reason: "Called about pickup timing and menu options.",
    },
  ],
  MEDICAL_WELLNESS: [
    {
      callerName: "Chris Rivera",
      callerPhone: "(555) 829-1044",
      reason: "Asked about appointment availability for next week.",
    },
    {
      callerName: "Sam Brooks",
      callerPhone: "(555) 503-6671",
      reason: "Wanted to ask about services and insurance questions.",
    },
    {
      callerName: "Jordan Kim",
      callerPhone: "(555) 721-8840",
      reason: "Called about consultation availability.",
    },
  ],
  LEGAL: [
    {
      callerName: "Chris Rivera",
      callerPhone: "(555) 829-1044",
      reason: "Asked about scheduling an initial consultation.",
    },
    {
      callerName: "Sam Brooks",
      callerPhone: "(555) 503-6671",
      reason: "Wanted to know if the firm handles their case type.",
    },
    {
      callerName: "Jordan Kim",
      callerPhone: "(555) 721-8840",
      reason: "Called about fees and appointment availability.",
    },
  ],
  FITNESS: [
    {
      callerName: "Chris Rivera",
      callerPhone: "(555) 829-1044",
      reason: "Asked about membership options and trial classes.",
    },
    {
      callerName: "Sam Brooks",
      callerPhone: "(555) 503-6671",
      reason: "Wanted personal training availability.",
    },
    {
      callerName: "Jordan Kim",
      callerPhone: "(555) 721-8840",
      reason: "Called about class schedules.",
    },
  ],
  REAL_ESTATE: [
    {
      callerName: "Chris Rivera",
      callerPhone: "(555) 829-1044",
      reason: "Asked about scheduling a property showing.",
    },
    {
      callerName: "Sam Brooks",
      callerPhone: "(555) 503-6671",
      reason: "Wanted information about selling their home.",
    },
    {
      callerName: "Jordan Kim",
      callerPhone: "(555) 721-8840",
      reason: "Called about rental availability.",
    },
  ],
  PROFESSIONAL_SERVICES: [
    {
      callerName: "Chris Rivera",
      callerPhone: "(555) 829-1044",
      reason: "Asked about booking a consultation.",
    },
    {
      callerName: "Sam Brooks",
      callerPhone: "(555) 503-6671",
      reason: "Wanted to understand service pricing.",
    },
    {
      callerName: "Jordan Kim",
      callerPhone: "(555) 721-8840",
      reason: "Called about project availability.",
    },
  ],
  RETAIL: [
    {
      callerName: "Chris Rivera",
      callerPhone: "(555) 829-1044",
      reason: "Asked about product availability.",
    },
    {
      callerName: "Sam Brooks",
      callerPhone: "(555) 503-6671",
      reason: "Wanted pickup timing for an order.",
    },
    {
      callerName: "Jordan Kim",
      callerPhone: "(555) 721-8840",
      reason: "Called about store hours and special orders.",
    },
  ],
}

function makeDate(monthsAgo: number, day: number) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, 10, 0, 0)
}

function closeDate(createdAt: Date, daysLater: number) {
  const date = new Date(createdAt)
  date.setDate(date.getDate() + daysLater)
  return date
}

export function getAverageLeadValueCents(businessType: string) {
  return averageLeadValues[businessType] ?? averageLeadValues.OTHER
}

export function getStarterMissedCalls(businessId: string, businessType: string) {
  const seedCalls =
    seedCallsByType[businessType as keyof typeof seedCallsByType] ??
    seedCallsByType.PROFESSIONAL_SERVICES

  return seedCalls.map((call) => ({
    ...call,
    businessId,
  }))
}

export function getStarterLeads(businessId: string, businessType: string) {
  const baseValue = getAverageLeadValueCents(businessType)
  const firstWonDate = makeDate(5, 8)
  const secondWonDate = makeDate(3, 17)
  const thirdWonDate = makeDate(1, 12)

  return [
    {
      businessId,
      customerName: "Jamie Parker",
      customerPhone: "(555) 014-1824",
      source: "MISSED_CALL",
      status: "WON",
      estimatedValueCents: baseValue,
      wonValueCents: baseValue,
      createdAt: firstWonDate,
      closedAt: closeDate(firstWonDate, 2),
    },
    {
      businessId,
      customerName: "Morgan Lee",
      customerPhone: "(555) 016-4480",
      source: "WEBSITE",
      status: "CONTACTED",
      estimatedValueCents: Math.round(baseValue * 0.7),
      wonValueCents: 0,
      createdAt: makeDate(4, 14),
      closedAt: null,
    },
    {
      businessId,
      customerName: "Taylor Brooks",
      customerPhone: "(555) 019-2571",
      source: "MISSED_CALL",
      status: "WON",
      estimatedValueCents: Math.round(baseValue * 1.3),
      wonValueCents: Math.round(baseValue * 1.15),
      createdAt: secondWonDate,
      closedAt: closeDate(secondWonDate, 3),
    },
    {
      businessId,
      customerName: "Casey Nguyen",
      customerPhone: "(555) 013-9022",
      source: "REFERRAL",
      status: "LOST",
      estimatedValueCents: Math.round(baseValue * 0.5),
      wonValueCents: 0,
      createdAt: makeDate(2, 6),
      closedAt: closeDate(makeDate(2, 6), 4),
    },
    {
      businessId,
      customerName: "Riley Smith",
      customerPhone: "(555) 011-7304",
      source: "WEBSITE",
      status: "NEW",
      estimatedValueCents: Math.round(baseValue * 0.8),
      wonValueCents: 0,
      createdAt: makeDate(1, 4),
      closedAt: null,
    },
    {
      businessId,
      customerName: "Avery Johnson",
      customerPhone: "(555) 018-6161",
      source: "MISSED_CALL",
      status: "WON",
      estimatedValueCents: Math.round(baseValue * 1.1),
      wonValueCents: baseValue,
      createdAt: thirdWonDate,
      closedAt: closeDate(thirdWonDate, 1),
    },
    {
      businessId,
      customerName: "Jordan Davis",
      customerPhone: "(555) 015-3348",
      source: "MANUAL",
      status: "CONTACTED",
      estimatedValueCents: Math.round(baseValue * 0.9),
      wonValueCents: 0,
      createdAt: makeDate(0, 10),
      closedAt: null,
    },
    {
      businessId,
      customerName: "Skyler Reed",
      customerPhone: "(555) 017-4209",
      source: "WEBSITE",
      status: "NEW",
      estimatedValueCents: Math.round(baseValue * 0.6),
      wonValueCents: 0,
      createdAt: makeDate(0, 19),
      closedAt: null,
    },
  ]
}
