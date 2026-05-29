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

function minutesAgo(minutes: number) {
  const date = new Date()
  date.setMinutes(date.getMinutes() - minutes)
  return date
}

function replyDate(createdAt: Date, minutesLater: number) {
  const date = new Date(createdAt)
  date.setMinutes(date.getMinutes() + minutesLater)
  return date
}

export function getAverageLeadValueCents(businessType: string) {
  return averageLeadValues[businessType] ?? averageLeadValues.OTHER
}

export function getStarterMissedCalls(businessId: string, businessType: string) {
  const seedCalls =
    seedCallsByType[businessType as keyof typeof seedCallsByType] ??
    seedCallsByType.PROFESSIONAL_SERVICES

  return seedCalls.map((call, index) => {
    const createdAt = minutesAgo([190, 75, 25][index] ?? 30)
    const replyDelayMinutes = index === 0 ? 18 : null

    return {
      ...call,
      businessId,
      createdAt,
      status: replyDelayMinutes ? "REPLIED" : "NEW",
      repliedAt: replyDelayMinutes
        ? replyDate(createdAt, replyDelayMinutes)
        : null,
    }
  })
}

export function getStarterLeads(businessId: string, businessType: string) {
  const baseValue = getAverageLeadValueCents(businessType)
  const firstCapturedDate = makeDate(5, 8)
  const secondCapturedDate = makeDate(3, 17)
  const thirdCapturedDate = makeDate(1, 12)

  return [
    {
      businessId,
      customerName: "Jamie Parker",
      customerPhone: "(555) 014-1824",
      customerEmail: "jamie@example.com",
      source: "MISSED_CALL",
      status: "CAPTURED",
      estimatedValueCents: baseValue,
      capturedValueCents: baseValue,
      createdAt: firstCapturedDate,
      closedAt: closeDate(firstCapturedDate, 2),
      appointmentStatus: "SHOWED",
      appointmentAt: closeDate(firstCapturedDate, 1),
      appointmentNotes: "Customer showed and completed the first appointment.",
      followUpAt: null,
      followUpNote: "",
    },
    {
      businessId,
      customerName: "Morgan Lee",
      customerPhone: "(555) 016-4480",
      customerEmail: "morgan@example.com",
      source: "WEBSITE",
      status: "CONTACTED",
      estimatedValueCents: Math.round(baseValue * 0.7),
      capturedValueCents: 0,
      createdAt: makeDate(4, 14),
      closedAt: null,
      appointmentStatus: "BOOKED",
      appointmentAt: closeDate(makeDate(0, 14), 2),
      appointmentNotes: "Booked from the website form; owner still needs to confirm details.",
      followUpAt: new Date(),
      followUpNote: "Confirm the booked appointment and answer pricing questions.",
    },
    {
      businessId,
      customerName: "Taylor Brooks",
      customerPhone: "(555) 019-2571",
      customerEmail: "taylor@example.com",
      source: "MISSED_CALL",
      status: "CAPTURED",
      estimatedValueCents: Math.round(baseValue * 1.3),
      capturedValueCents: Math.round(baseValue * 1.15),
      createdAt: secondCapturedDate,
      closedAt: closeDate(secondCapturedDate, 3),
      appointmentStatus: "SHOWED",
      appointmentAt: closeDate(secondCapturedDate, 1),
      appointmentNotes: "Appointment completed and marked captured.",
      followUpAt: null,
      followUpNote: "",
    },
    {
      businessId,
      customerName: "Casey Nguyen",
      customerPhone: "(555) 013-9022",
      customerEmail: "",
      source: "REFERRAL",
      status: "LOST",
      estimatedValueCents: Math.round(baseValue * 0.5),
      capturedValueCents: 0,
      createdAt: makeDate(2, 6),
      closedAt: closeDate(makeDate(2, 6), 4),
      appointmentStatus: "CANCELLED",
      appointmentAt: closeDate(makeDate(2, 6), 2),
      appointmentNotes: "Customer cancelled and chose another provider.",
      followUpAt: null,
      followUpNote: "",
    },
    {
      businessId,
      customerName: "Riley Smith",
      customerPhone: "(555) 011-7304",
      customerEmail: "riley@example.com",
      source: "WEBSITE",
      status: "NEW",
      estimatedValueCents: Math.round(baseValue * 0.8),
      capturedValueCents: 0,
      createdAt: makeDate(1, 4),
      closedAt: null,
      appointmentStatus: "NOT_BOOKED",
      appointmentAt: null,
      appointmentNotes: "",
      followUpAt: new Date(),
      followUpNote: "Follow up on the website request and offer next available times.",
    },
    {
      businessId,
      customerName: "Avery Johnson",
      customerPhone: "(555) 018-6161",
      customerEmail: "avery@example.com",
      source: "MISSED_CALL",
      status: "CAPTURED",
      estimatedValueCents: Math.round(baseValue * 1.1),
      capturedValueCents: baseValue,
      createdAt: thirdCapturedDate,
      closedAt: closeDate(thirdCapturedDate, 1),
      appointmentStatus: "SHOWED",
      appointmentAt: thirdCapturedDate,
      appointmentNotes: "Customer arrived and the work was completed.",
      followUpAt: null,
      followUpNote: "",
    },
    {
      businessId,
      customerName: "Jordan Davis",
      customerPhone: "(555) 015-3348",
      customerEmail: "jordan@example.com",
      source: "MANUAL",
      status: "CONTACTED",
      estimatedValueCents: Math.round(baseValue * 0.9),
      capturedValueCents: 0,
      createdAt: makeDate(0, 10),
      closedAt: null,
      appointmentStatus: "RESCHEDULED",
      appointmentAt: closeDate(makeDate(0, 10), 3),
      appointmentNotes: "Customer asked to move the appointment once.",
      followUpAt: new Date(),
      followUpNote: "Send rescheduled appointment confirmation.",
    },
    {
      businessId,
      customerName: "Skyler Reed",
      customerPhone: "(555) 017-4209",
      customerEmail: "",
      source: "WEBSITE",
      status: "NEW",
      estimatedValueCents: Math.round(baseValue * 0.6),
      capturedValueCents: 0,
      createdAt: makeDate(0, 19),
      closedAt: null,
      appointmentStatus: "NOT_BOOKED",
      appointmentAt: null,
      appointmentNotes: "",
      followUpAt: new Date(),
      followUpNote: "Ask what time works best and qualify the request.",
    },
  ]
}
