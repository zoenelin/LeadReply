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

type HomeServicePresetSpec = {
  estimateName: string
  estimateDescription: string
  emergencyName: string
  emergencyDescription: string
  maintenanceName: string
  maintenanceDescription: string
  category: string
  estimateLowCents: number
  estimateHighCents: number
  emergencyLowCents: number
  emergencyHighCents: number
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

const homeServicePresetSpecs: Record<string, HomeServicePresetSpec> = {
  HVAC: {
    estimateName: "HVAC repair estimate",
    estimateDescription: "Heating, cooling, no heat, no AC, thermostat, airflow, or system issue.",
    emergencyName: "No heat or no AC urgent call",
    emergencyDescription: "Urgent heating or cooling issue that may need same-day triage.",
    maintenanceName: "HVAC tune-up",
    maintenanceDescription: "Seasonal maintenance, inspection, filter, and system check.",
    category: "HVAC",
    estimateLowCents: 9900,
    estimateHighCents: 35000,
    emergencyLowCents: 15000,
    emergencyHighCents: 60000,
  },
  PLUMBING: {
    estimateName: "Plumbing repair estimate",
    estimateDescription: "Leak, drain, toilet, sink, water heater, fixture, or pipe repair request.",
    emergencyName: "Urgent plumbing issue",
    emergencyDescription: "Active leak, no water, sewer backup, or urgent plumbing concern.",
    maintenanceName: "Plumbing inspection",
    maintenanceDescription: "Fixture check, drain check, water heater check, or general plumbing inspection.",
    category: "Plumbing",
    estimateLowCents: 9900,
    estimateHighCents: 40000,
    emergencyLowCents: 17500,
    emergencyHighCents: 70000,
  },
  ELECTRICAL: {
    estimateName: "Electrical repair estimate",
    estimateDescription: "Outlet, breaker, lighting, panel, wiring, safety, or power issue.",
    emergencyName: "Urgent electrical concern",
    emergencyDescription: "Power loss, sparking, burning smell, or safety concern requiring fast owner review.",
    maintenanceName: "Electrical inspection",
    maintenanceDescription: "Safety inspection, panel check, outlet check, or routine electrical review.",
    category: "Electrical",
    estimateLowCents: 12500,
    estimateHighCents: 50000,
    emergencyLowCents: 20000,
    emergencyHighCents: 80000,
  },
  ROOFING: {
    estimateName: "Roof repair estimate",
    estimateDescription: "Leak, missing shingles, storm damage, flashing, gutter, or roof inspection.",
    emergencyName: "Urgent roof leak",
    emergencyDescription: "Active leak, storm damage, tarp request, or urgent roof issue.",
    maintenanceName: "Roof inspection",
    maintenanceDescription: "Roof condition check, maintenance inspection, or storm follow-up.",
    category: "Roofing",
    estimateLowCents: 25000,
    estimateHighCents: 150000,
    emergencyLowCents: 30000,
    emergencyHighCents: 200000,
  },
  LANDSCAPING: {
    estimateName: "Landscaping estimate",
    estimateDescription: "Lawn care, cleanup, planting, mulch, irrigation, or outdoor project.",
    emergencyName: "Urgent outdoor issue",
    emergencyDescription: "Storm cleanup, fallen branches, irrigation leak, or urgent property concern.",
    maintenanceName: "Recurring lawn care",
    maintenanceDescription: "Mowing, trimming, seasonal cleanup, or recurring maintenance.",
    category: "Landscaping",
    estimateLowCents: 7500,
    estimateHighCents: 60000,
    emergencyLowCents: 15000,
    emergencyHighCents: 80000,
  },
  CLEANING: {
    estimateName: "Cleaning estimate",
    estimateDescription: "Home cleaning, deep clean, move-out clean, office clean, or recurring service.",
    emergencyName: "Rush cleaning request",
    emergencyDescription: "Short-notice cleaning, move-out timing, event cleanup, or urgent cleaning need.",
    maintenanceName: "Recurring cleaning",
    maintenanceDescription: "Weekly, biweekly, monthly, or recurring cleaning service.",
    category: "Cleaning",
    estimateLowCents: 12000,
    estimateHighCents: 50000,
    emergencyLowCents: 18000,
    emergencyHighCents: 65000,
  },
  PEST_CONTROL: {
    estimateName: "Pest control estimate",
    estimateDescription: "Insects, rodents, wasps, ants, termites, inspection, or treatment request.",
    emergencyName: "Urgent pest issue",
    emergencyDescription: "Infestation, wasp nest, rodent issue, or urgent pest concern.",
    maintenanceName: "Recurring pest service",
    maintenanceDescription: "Quarterly service, prevention plan, inspection, or routine treatment.",
    category: "Pest control",
    estimateLowCents: 9500,
    estimateHighCents: 45000,
    emergencyLowCents: 15000,
    emergencyHighCents: 60000,
  },
  HANDYMAN: {
    estimateName: "Handyman project estimate",
    estimateDescription: "Repair, assembly, installation, fixture, door, drywall, or small project.",
    emergencyName: "Urgent repair request",
    emergencyDescription: "Fast repair need, safety issue, access issue, or time-sensitive job.",
    maintenanceName: "Home maintenance visit",
    maintenanceDescription: "Punch list, seasonal maintenance, small repairs, or inspection.",
    category: "Handyman",
    estimateLowCents: 9500,
    estimateHighCents: 50000,
    emergencyLowCents: 15000,
    emergencyHighCents: 65000,
  },
  APPLIANCE_REPAIR: {
    estimateName: "Appliance repair estimate",
    estimateDescription: "Washer, dryer, fridge, dishwasher, oven, or appliance issue.",
    emergencyName: "Urgent appliance repair",
    emergencyDescription: "No cooling, leaking appliance, failed essential appliance, or urgent repair.",
    maintenanceName: "Appliance diagnostic",
    maintenanceDescription: "Diagnostic visit, maintenance check, or appliance assessment.",
    category: "Appliance repair",
    estimateLowCents: 9500,
    estimateHighCents: 35000,
    emergencyLowCents: 15000,
    emergencyHighCents: 50000,
  },
  GARAGE_DOORS: {
    estimateName: "Garage door repair estimate",
    estimateDescription: "Door, spring, opener, track, sensor, remote, or stuck door issue.",
    emergencyName: "Garage door urgent call",
    emergencyDescription: "Door stuck open/closed, broken spring, access issue, or urgent safety concern.",
    maintenanceName: "Garage door tune-up",
    maintenanceDescription: "Inspection, opener check, balance check, lubrication, or tune-up.",
    category: "Garage doors",
    estimateLowCents: 9500,
    estimateHighCents: 50000,
    emergencyLowCents: 15000,
    emergencyHighCents: 75000,
  },
  PAINTING: {
    estimateName: "Painting estimate",
    estimateDescription: "Interior painting, exterior painting, touch-ups, cabinet painting, or staining.",
    emergencyName: "Rush painting request",
    emergencyDescription: "Time-sensitive paint project, move-in deadline, damage repair, or urgent request.",
    maintenanceName: "Paint consultation",
    maintenanceDescription: "Color, scope, prep, surface, or project consultation.",
    category: "Painting",
    estimateLowCents: 25000,
    estimateHighCents: 150000,
    emergencyLowCents: 35000,
    emergencyHighCents: 200000,
  },
  FLOORING: {
    estimateName: "Flooring estimate",
    estimateDescription: "Install, repair, refinish, carpet, tile, vinyl, hardwood, or laminate request.",
    emergencyName: "Urgent flooring issue",
    emergencyDescription: "Water damage, trip hazard, repair need, or time-sensitive flooring request.",
    maintenanceName: "Flooring consultation",
    maintenanceDescription: "Material, measurement, repair, refinishing, or installation consultation.",
    category: "Flooring",
    estimateLowCents: 25000,
    estimateHighCents: 200000,
    emergencyLowCents: 35000,
    emergencyHighCents: 250000,
  },
  REMODELING: {
    estimateName: "Remodeling estimate",
    estimateDescription: "Kitchen, bath, basement, addition, repair, or renovation project.",
    emergencyName: "Urgent remodel repair",
    emergencyDescription: "Damage repair, safety issue, active leak impact, or time-sensitive project.",
    maintenanceName: "Project consultation",
    maintenanceDescription: "Scope, timeline, budget, planning, or renovation consultation.",
    category: "Remodeling",
    estimateLowCents: 50000,
    estimateHighCents: 300000,
    emergencyLowCents: 75000,
    emergencyHighCents: 400000,
  },
  JUNK_REMOVAL: {
    estimateName: "Junk removal estimate",
    estimateDescription: "Furniture, debris, cleanout, appliance removal, yard waste, or haul-away.",
    emergencyName: "Rush removal request",
    emergencyDescription: "Same-day or urgent junk removal, move-out deadline, or blocked access.",
    maintenanceName: "Cleanout planning",
    maintenanceDescription: "Garage, basement, estate, rental, or recurring cleanout planning.",
    category: "Junk removal",
    estimateLowCents: 12000,
    estimateHighCents: 75000,
    emergencyLowCents: 18000,
    emergencyHighCents: 95000,
  },
  MOBILE_DETAILING: {
    estimateName: "Mobile detailing estimate",
    estimateDescription: "Interior detail, exterior detail, full detail, stain, odor, or fleet service.",
    emergencyName: "Rush detailing request",
    emergencyDescription: "Short-notice detail, event prep, sale prep, spill, odor, or urgent detail.",
    maintenanceName: "Recurring detailing",
    maintenanceDescription: "Maintenance wash, monthly detail, fleet detail, or recurring service.",
    category: "Mobile detailing",
    estimateLowCents: 10000,
    estimateHighCents: 50000,
    emergencyLowCents: 15000,
    emergencyHighCents: 70000,
  },
}

function getHomeServiceSpecialtyPresets(businessType: string) {
  const spec = homeServicePresetSpecs[businessType]

  if (!spec) {
    return null
  }

  return [
    service(0, {
      name: spec.estimateName,
      description: spec.estimateDescription,
      category: spec.category,
      estimateLowCents: spec.estimateLowCents,
      estimateHighCents: spec.estimateHighCents,
      durationMinutes: 60,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
    service(1, {
      name: spec.emergencyName,
      description: spec.emergencyDescription,
      category: "Urgent",
      estimateLowCents: spec.emergencyLowCents,
      estimateHighCents: spec.emergencyHighCents,
      durationMinutes: 90,
      bookableOnline: false,
      ownerConfirmRequired: true,
    }),
    service(2, {
      name: spec.maintenanceName,
      description: spec.maintenanceDescription,
      category: "Maintenance",
      estimateLowCents: spec.estimateLowCents,
      estimateHighCents: spec.estimateHighCents,
      durationMinutes: 75,
      bookableOnline: true,
      ownerConfirmRequired: true,
    }),
  ]
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
  return (
    getHomeServiceSpecialtyPresets(businessType) ??
    presets[businessType] ??
    presets.OTHER
  )
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
