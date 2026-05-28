type ServicePreset = {
  name: string
  description: string
  category: string
  estimateLowCents: number
  estimateHighCents: number
  durationMinutes: number
  bookableOnline: boolean
  ownerConfirmRequired: boolean
  active: boolean
  displayOrder: number
}

type AvailabilityPreset = {
  dayOfWeek: number
  startTime: string
  endTime: string
  minimumNoticeHours: number
  active: boolean
}

const weekdayAvailability: AvailabilityPreset[] = [1, 2, 3, 4, 5].map(
  (dayOfWeek) => ({
    dayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
    minimumNoticeHours: 4,
    active: true,
  })
)

const tuesdayToSaturdayAvailability: AvailabilityPreset[] = [2, 3, 4, 5, 6].map(
  (dayOfWeek) => ({
    dayOfWeek,
    startTime: "10:00",
    endTime: "18:00",
    minimumNoticeHours: 4,
    active: true,
  })
)

const restaurantAvailability: AvailabilityPreset[] = [2, 3, 4, 5, 6].map(
  (dayOfWeek) => ({
    dayOfWeek,
    startTime: "17:00",
    endTime: "21:00",
    minimumNoticeHours: 2,
    active: true,
  })
)

function service(
  displayOrder: number,
  values: Omit<ServicePreset, "displayOrder" | "active">
): ServicePreset {
  return {
    ...values,
    active: true,
    displayOrder,
  }
}

const presets: Record<string, ServicePreset[]> = {
  AUTOMOTIVE: [
    service(0, {
      name: "Oil change",
      description: "Routine oil change, maintenance visit, mileage service.",
      category: "Maintenance",
      estimateLowCents: 7500,
      estimateHighCents: 14000,
      durationMinutes: 45,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(1, {
      name: "Brake inspection",
      description: "Brake noise, pads, rotors, inspection, stopping issue.",
      category: "Repair",
      estimateLowCents: 12000,
      estimateHighCents: 45000,
      durationMinutes: 75,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(2, {
      name: "Diagnostic appointment",
      description: "Check engine light, strange sound, no-start, inspection.",
      category: "Diagnostics",
      estimateLowCents: 9500,
      estimateHighCents: 18000,
      durationMinutes: 90,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
  ],
  HOME_SERVICES: [
    service(0, {
      name: "Repair estimate",
      description: "Home repair, service call, quote request, project estimate.",
      category: "Estimate",
      estimateLowCents: 9900,
      estimateHighCents: 25000,
      durationMinutes: 60,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(1, {
      name: "Emergency service",
      description: "Urgent issue, leak, no heat, electrical concern, same day.",
      category: "Urgent",
      estimateLowCents: 15000,
      estimateHighCents: 50000,
      durationMinutes: 90,
      bookableOnline: false,
      ownerConfirmRequired: true,
    }),
    service(2, {
      name: "Maintenance visit",
      description: "Tune-up, inspection, seasonal maintenance, routine service.",
      category: "Maintenance",
      estimateLowCents: 12000,
      estimateHighCents: 30000,
      durationMinutes: 75,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
  ],
  BEAUTY_SERVICES: [
    service(0, {
      name: "Hair appointment",
      description: "Haircut, color, style, blowout, trim, consultation.",
      category: "Hair",
      estimateLowCents: 6500,
      estimateHighCents: 22000,
      durationMinutes: 90,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(1, {
      name: "Nail appointment",
      description: "Manicure, pedicure, gel, acrylic, nail art, fill.",
      category: "Nails",
      estimateLowCents: 4500,
      estimateHighCents: 14000,
      durationMinutes: 75,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(2, {
      name: "Consultation",
      description: "New client consultation, service planning, quote request.",
      category: "Consultation",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 30,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
  ],
  FOOD_SERVICES: [
    service(0, {
      name: "Table reservation",
      description: "Dinner reservation, party size, date, time, seating request.",
      category: "Reservation",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 90,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(1, {
      name: "Catering request",
      description: "Event catering, party tray, large order, delivery question.",
      category: "Catering",
      estimateLowCents: 25000,
      estimateHighCents: 150000,
      durationMinutes: 30,
      bookableOnline: false,
      ownerConfirmRequired: true,
    }),
    service(2, {
      name: "Pickup order question",
      description: "Pickup, takeout, menu question, order change, special request.",
      category: "Takeout",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 15,
      bookableOnline: false,
      ownerConfirmRequired: true,
    }),
  ],
  MEDICAL_WELLNESS: [
    service(0, {
      name: "New patient appointment",
      description: "New patient, consultation, intake, insurance question.",
      category: "Appointment",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 60,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(1, {
      name: "Wellness consultation",
      description: "Wellness visit, therapy, treatment, plan, availability.",
      category: "Consultation",
      estimateLowCents: 8500,
      estimateHighCents: 25000,
      durationMinutes: 60,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(2, {
      name: "Follow-up appointment",
      description: "Existing client, follow-up visit, recheck, next appointment.",
      category: "Follow-up",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 45,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
  ],
  LEGAL: [
    service(0, {
      name: "Consultation",
      description: "Legal consultation, case fit, attorney call, new matter.",
      category: "Consultation",
      estimateLowCents: 0,
      estimateHighCents: 25000,
      durationMinutes: 45,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(1, {
      name: "Document review",
      description: "Contract review, document question, legal paperwork.",
      category: "Review",
      estimateLowCents: 25000,
      estimateHighCents: 75000,
      durationMinutes: 60,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(2, {
      name: "Existing client callback",
      description: "Current client, case update, attorney callback request.",
      category: "Client service",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 30,
      bookableOnline: false,
      ownerConfirmRequired: true,
    }),
  ],
  FITNESS: [
    service(0, {
      name: "Intro class",
      description: "Trial class, first visit, class schedule, beginner session.",
      category: "Classes",
      estimateLowCents: 0,
      estimateHighCents: 3500,
      durationMinutes: 60,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(1, {
      name: "Personal training consultation",
      description: "Personal training, goals, assessment, coach consultation.",
      category: "Training",
      estimateLowCents: 0,
      estimateHighCents: 10000,
      durationMinutes: 45,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(2, {
      name: "Membership question",
      description: "Membership, pricing, cancellation, enrollment, tour.",
      category: "Membership",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 30,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
  ],
  REAL_ESTATE: [
    service(0, {
      name: "Showing request",
      description: "Property showing, buyer tour, rental showing, availability.",
      category: "Showing",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 45,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(1, {
      name: "Home valuation",
      description: "Seller lead, home value, listing consultation, market estimate.",
      category: "Seller",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 60,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(2, {
      name: "Buyer consultation",
      description: "Buyer lead, financing, search criteria, first appointment.",
      category: "Buyer",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 60,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
  ],
  PROFESSIONAL_SERVICES: [
    service(0, {
      name: "Discovery call",
      description: "Consultation, project inquiry, pricing, timeline, scope.",
      category: "Consultation",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 45,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(1, {
      name: "Project estimate",
      description: "Quote, proposal, estimate, project details, requirements.",
      category: "Estimate",
      estimateLowCents: 25000,
      estimateHighCents: 150000,
      durationMinutes: 60,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(2, {
      name: "Client support callback",
      description: "Existing client, support request, status update, help.",
      category: "Support",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 30,
      bookableOnline: false,
      ownerConfirmRequired: true,
    }),
  ],
  RETAIL: [
    service(0, {
      name: "Product availability",
      description: "Inventory check, in stock, product question, store availability.",
      category: "Inventory",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 15,
      bookableOnline: false,
      ownerConfirmRequired: true,
    }),
    service(1, {
      name: "Special order",
      description: "Custom order, special order, item request, pickup timing.",
      category: "Orders",
      estimateLowCents: 2500,
      estimateHighCents: 50000,
      durationMinutes: 30,
      bookableOnline: false,
      ownerConfirmRequired: true,
    }),
    service(2, {
      name: "Store appointment",
      description: "Shopping appointment, fitting, consultation, product demo.",
      category: "Appointment",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 45,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
  ],
  OTHER: [
    service(0, {
      name: "Callback request",
      description: "General lead, callback, question, service request.",
      category: "General",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 30,
      bookableOnline: false,
      ownerConfirmRequired: true,
    }),
    service(1, {
      name: "Consultation",
      description: "Consultation, appointment, quote, next step.",
      category: "Consultation",
      estimateLowCents: 0,
      estimateHighCents: 0,
      durationMinutes: 45,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
  ],
}

export function getIndustryServicePresets(businessType: string) {
  return presets[businessType] ?? presets.OTHER
}

export function getIndustryAvailabilityPresets(businessType: string) {
  if (businessType === "FOOD_SERVICES") {
    return restaurantAvailability
  }

  if (businessType === "BEAUTY_SERVICES" || businessType === "RETAIL") {
    return tuesdayToSaturdayAvailability
  }

  return weekdayAvailability
}
