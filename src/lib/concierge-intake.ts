export type ConciergeTranscriptEntry = {
  role: "assistant" | "customer" | "system"
  text: string
  createdAt: string
}

export type ConciergeAnswerMap = Record<string, string>

export type ConciergeQuestion = {
  key: string
  label: string
  prompt: string
  placeholder: string
  sampleAnswer: string
}

export type ConciergePlan = {
  openingMessage: string
  questions: ConciergeQuestion[]
}

export type ConciergeIntakeStatsItem = {
  status: string
  schedulingRequested: boolean
}

type ConciergePlanInput = {
  businessName: string
  businessType: string
  callerName: string
  bookingAutomationEnabled: boolean
}

type ConciergeSummaryInput = {
  answers: ConciergeAnswerMap
  businessType: string
  bookingAutomationEnabled: boolean
}

const genericQuestions: ConciergeQuestion[] = [
  {
    key: "request",
    label: "Request",
    prompt: "What can we help you with today?",
    placeholder: "I need help with...",
    sampleAnswer: "I need a quote and would like to talk this week.",
  },
  {
    key: "urgency",
    label: "Urgency",
    prompt: "Is this urgent today, this week, or flexible?",
    placeholder: "Today, this week, flexible...",
    sampleAnswer: "This week is fine.",
  },
]

const questionSets: Record<string, ConciergeQuestion[]> = {
  AUTOMOTIVE: [
    {
      key: "vehicle",
      label: "Vehicle",
      prompt: "What vehicle do you need help with?",
      placeholder: "2018 Toyota Camry...",
      sampleAnswer: "2018 Toyota Camry.",
    },
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: "What issue or service are you looking for?",
      placeholder: "Brake repair, inspection, oil change...",
      sampleAnswer: "Brake pads are squeaking and I need an estimate.",
    },
    {
      key: "urgency",
      label: "Urgency",
      prompt: "Is this urgent today, or are you looking to schedule this week?",
      placeholder: "Today, tomorrow, this week...",
      sampleAnswer: "This week works.",
    },
  ],
  HOME_SERVICES: [
    {
      key: "projectType",
      label: "Project",
      prompt: "What service or project do you need help with?",
      placeholder: "Repair, estimate, emergency service...",
      sampleAnswer: "I need an estimate for a leaking sink.",
    },
    {
      key: "location",
      label: "Location",
      prompt: "What city or ZIP code is the job in?",
      placeholder: "City or ZIP...",
      sampleAnswer: "Austin, 78702.",
    },
    {
      key: "urgency",
      label: "Urgency",
      prompt: "Is this urgent today, this week, or flexible?",
      placeholder: "Today, this week, flexible...",
      sampleAnswer: "Tomorrow would be best.",
    },
  ],
  BEAUTY_SERVICES: [
    {
      key: "serviceNeed",
      label: "Service",
      prompt: "What service are you looking to book?",
      placeholder: "Haircut, nails, color, full set...",
      sampleAnswer: "A haircut and color.",
    },
    {
      key: "timing",
      label: "Timing",
      prompt: "What day or time works best for you?",
      placeholder: "Friday afternoon, Saturday morning...",
      sampleAnswer: "Friday afternoon if possible.",
    },
    {
      key: "preference",
      label: "Preference",
      prompt: "Do you have a preferred stylist, tech, or service provider?",
      placeholder: "No preference, specific person...",
      sampleAnswer: "No preference.",
    },
  ],
  FOOD_SERVICES: [
    {
      key: "requestType",
      label: "Request type",
      prompt: "Are you asking about a reservation, catering, pickup, or something else?",
      placeholder: "Reservation, catering, pickup...",
      sampleAnswer: "Reservation.",
    },
    {
      key: "partyDetails",
      label: "Party details",
      prompt: "How many people and what date or time are you hoping for?",
      placeholder: "4 people Friday at 7...",
      sampleAnswer: "4 people this Friday around 7 PM.",
    },
    {
      key: "specialNotes",
      label: "Special notes",
      prompt: "Any special requests we should know about?",
      placeholder: "Birthday, patio, allergies...",
      sampleAnswer: "A booth would be nice.",
    },
  ],
  MEDICAL_WELLNESS: [
    {
      key: "appointmentType",
      label: "Appointment type",
      prompt: "What type of appointment are you looking for?",
      placeholder: "Consultation, follow-up, service...",
      sampleAnswer: "A new client consultation.",
    },
    {
      key: "timing",
      label: "Timing",
      prompt: "What days or times usually work best for you?",
      placeholder: "Mornings, afternoons, specific day...",
      sampleAnswer: "Mornings work best.",
    },
    {
      key: "newOrReturning",
      label: "Client type",
      prompt: "Are you a new or returning client?",
      placeholder: "New client, returning client...",
      sampleAnswer: "New client.",
    },
  ],
  LEGAL: [
    {
      key: "matterType",
      label: "Matter type",
      prompt: "What type of legal help are you looking for?",
      placeholder: "Family, business, estate, injury...",
      sampleAnswer: "Business contract review.",
    },
    {
      key: "urgency",
      label: "Urgency",
      prompt: "Is there a deadline or urgent date involved?",
      placeholder: "Court date, deadline, no rush...",
      sampleAnswer: "No hard deadline, but this week would help.",
    },
    {
      key: "consultationTime",
      label: "Consultation time",
      prompt: "What is the best time to reach you for a consultation?",
      placeholder: "Tomorrow morning, weekday afternoons...",
      sampleAnswer: "Tomorrow afternoon.",
    },
  ],
  FITNESS: [
    {
      key: "interest",
      label: "Interest",
      prompt: "Are you interested in classes, personal training, or membership options?",
      placeholder: "Classes, training, membership...",
      sampleAnswer: "Personal training.",
    },
    {
      key: "goal",
      label: "Goal",
      prompt: "What goal are you working toward?",
      placeholder: "Strength, weight loss, flexibility...",
      sampleAnswer: "Strength and accountability.",
    },
    {
      key: "timing",
      label: "Timing",
      prompt: "What days or times usually work best?",
      placeholder: "Weekday mornings, evenings...",
      sampleAnswer: "Weekday evenings.",
    },
  ],
  REAL_ESTATE: [
    {
      key: "requestType",
      label: "Request type",
      prompt: "Are you looking to buy, sell, rent, or schedule a showing?",
      placeholder: "Buy, sell, rent, showing...",
      sampleAnswer: "Schedule a showing.",
    },
    {
      key: "propertyDetails",
      label: "Property details",
      prompt: "What property or area are you interested in?",
      placeholder: "Address, neighborhood, price range...",
      sampleAnswer: "Homes near downtown under $450k.",
    },
    {
      key: "timing",
      label: "Timing",
      prompt: "When would you like to talk or meet?",
      placeholder: "Today, weekend, next week...",
      sampleAnswer: "Saturday morning.",
    },
  ],
  PROFESSIONAL_SERVICES: [
    {
      key: "serviceNeed",
      label: "Service needed",
      prompt: "What service are you looking for?",
      placeholder: "Consulting, project help, estimate...",
      sampleAnswer: "I need help scoping a project.",
    },
    {
      key: "timeline",
      label: "Timeline",
      prompt: "What timeline are you hoping for?",
      placeholder: "This week, this month...",
      sampleAnswer: "I want to start this month.",
    },
    {
      key: "budgetOrScope",
      label: "Scope",
      prompt: "Do you have a rough scope or budget in mind?",
      placeholder: "Small project, ongoing work...",
      sampleAnswer: "Small project first, maybe ongoing after.",
    },
  ],
  RETAIL: [
    {
      key: "requestType",
      label: "Request type",
      prompt: "Are you asking about inventory, pickup, an order, or something else?",
      placeholder: "Inventory, pickup, order status...",
      sampleAnswer: "Inventory.",
    },
    {
      key: "productDetails",
      label: "Product details",
      prompt: "What product or order are you asking about?",
      placeholder: "Product name, size, order number...",
      sampleAnswer: "A blue medium jacket.",
    },
    {
      key: "timing",
      label: "Timing",
      prompt: "When do you need it by?",
      placeholder: "Today, this weekend, no rush...",
      sampleAnswer: "This weekend.",
    },
  ],
}

const schedulingQuestion = {
  key: "preferredTime",
  label: "Preferred time",
  placeholder: "Today after 3, Friday morning, any weekday...",
  sampleAnswer: "Tomorrow after 2 PM.",
}

function getQuestions(businessType: string, bookingAutomationEnabled: boolean) {
  const baseQuestions = questionSets[businessType] ?? genericQuestions

  return [
    ...baseQuestions,
    {
      ...schedulingQuestion,
      prompt: bookingAutomationEnabled
        ? "If we have an opening, what day or time should I check first?"
        : "What day or time would you prefer so the business can confirm?",
    },
  ]
}

function makeEntry(
  role: ConciergeTranscriptEntry["role"],
  text: string
): ConciergeTranscriptEntry {
  return {
    role,
    text,
    createdAt: new Date().toISOString(),
  }
}

function readRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function pickFirstAnswer(answers: ConciergeAnswerMap, keys: string[]) {
  for (const key of keys) {
    const value = answers[key]?.trim()
    if (value) {
      return value
    }
  }

  return ""
}

function detectUrgency(answers: ConciergeAnswerMap) {
  const answerText = Object.values(answers).join(" ").toLowerCase()

  if (/(emergency|urgent|asap|right now|today|tonight)/.test(answerText)) {
    return "Urgent"
  }

  if (/(tomorrow|this week|weekend|soon)/.test(answerText)) {
    return "Soon"
  }

  return "Flexible"
}

export function getConciergePlan({
  businessName,
  businessType,
  callerName,
  bookingAutomationEnabled,
}: ConciergePlanInput): ConciergePlan {
  const questions = getQuestions(businessType, bookingAutomationEnabled)

  return {
    openingMessage: `Hi ${callerName}, this is LeadReply for ${businessName}. Sorry we missed your call. I can ask a few quick questions so the team knows how to help.`,
    questions,
  }
}

export function createAssistantEntry(text: string) {
  return makeEntry("assistant", text)
}

export function createCustomerEntry(text: string) {
  return makeEntry("customer", text)
}

export function normalizeConciergeTranscript(
  value: unknown
): ConciergeTranscriptEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    const record = readRecord(entry)
    const role = record.role
    const text = record.text
    const createdAt = record.createdAt

    if (
      (role !== "assistant" && role !== "customer" && role !== "system") ||
      typeof text !== "string"
    ) {
      return []
    }

    const normalizedRole: ConciergeTranscriptEntry["role"] = role

    return [
      {
        role: normalizedRole,
        text,
        createdAt:
          typeof createdAt === "string" ? createdAt : new Date().toISOString(),
      },
    ]
  })
}

export function normalizeConciergeAnswers(value: unknown): ConciergeAnswerMap {
  const record = readRecord(value)

  return Object.fromEntries(
    Object.entries(record).flatMap(([key, answer]) =>
      typeof answer === "string" ? [[key, answer]] : []
    )
  )
}

export function getConciergeStatusLabel(status: string) {
  if (status === "READY_FOR_OWNER") {
    return "Ready for owner"
  }

  if (status === "COMPLETED") {
    return "Completed"
  }

  return "In progress"
}

export function conciergeStatusClassName(status: string) {
  if (status === "READY_FOR_OWNER") {
    return "bg-emerald-50 text-emerald-700"
  }

  if (status === "COMPLETED") {
    return "bg-slate-100 text-slate-600"
  }

  return "bg-sky-50 text-sky-700"
}

export function buildConciergeSummary({
  answers,
  businessType,
  bookingAutomationEnabled,
}: ConciergeSummaryInput) {
  const intent =
    pickFirstAnswer(answers, [
      "serviceNeed",
      "requestType",
      "projectType",
      "appointmentType",
      "matterType",
      "interest",
      "request",
    ]) || "Needs follow-up"
  const preferredTime =
    pickFirstAnswer(answers, [
      "preferredTime",
      "timing",
      "consultationTime",
      "timeline",
      "urgency",
    ]) || "No preferred time collected"
  const urgency = detectUrgency(answers)
  const schedulingRequested = Boolean(preferredTime)
  const industryContext =
    businessType === "FOOD_SERVICES"
      ? "reservation/order"
      : businessType === "BEAUTY_SERVICES"
        ? "appointment"
        : businessType === "AUTOMOTIVE"
          ? "service appointment"
          : "customer request"
  const summary = `${intent}. Timing: ${preferredTime}. Urgency: ${urgency}.`
  const nextAction = schedulingRequested
    ? bookingAutomationEnabled
      ? `Mock scheduling is ready: check connected availability for this ${industryContext} and offer the best matching time.`
      : `Scheduling not connected yet: text or call the customer to confirm ${preferredTime}.`
    : "Review the intake and send a specific next-step reply."

  return {
    intent,
    urgency,
    preferredTime,
    schedulingRequested,
    summary,
    nextAction,
  }
}

export function buildConciergeLeadNotes({
  summary,
  nextAction,
  answers,
}: {
  summary: string
  nextAction: string
  answers: ConciergeAnswerMap
}) {
  const answerLines = Object.entries(answers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n")

  return `AI missed-call concierge summary:\n${summary}\n\nRecommended next action:\n${nextAction}\n\nAnswers:\n${answerLines}`
}

export function getConciergeStats(intakes: ConciergeIntakeStatsItem[]) {
  const inProgressCount = intakes.filter(
    (intake) => intake.status === "IN_PROGRESS"
  ).length
  const readyCount = intakes.filter(
    (intake) => intake.status === "READY_FOR_OWNER"
  ).length
  const completedCount = intakes.filter(
    (intake) => intake.status === "COMPLETED"
  ).length
  const schedulingRequestedCount = intakes.filter(
    (intake) => intake.schedulingRequested
  ).length

  return {
    totalCount: intakes.length,
    inProgressCount,
    readyCount,
    completedCount,
    schedulingRequestedCount,
  }
}
