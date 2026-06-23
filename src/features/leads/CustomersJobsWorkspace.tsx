"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  customerJobColumnKeys,
  customerJobColumnLabels,
  defaultCustomerJobColumns,
  defaultCustomerJobFilters,
  getDefaultCustomerJobColumnWidth,
  type CustomerJobColumnWidths,
  type CustomerJobColumnKey,
  type CustomerJobSavedView,
  type CustomerJobSortKey,
  type CustomerJobViewFilter,
  type CustomerJobViewFilters,
  type CustomerJobWorkbookColumn,
  type CustomerJobWorkbookColumnFormat,
} from "@/lib/domain/customer-job-views"
import {
  appointmentStatusLabels,
  centsToDollars,
  formatMoney,
  leadSourceLabels,
  leadSourceOptions,
  leadStatusOptions,
  normalizeLeadStatus,
  statusClassName,
} from "@/lib/domain/lead-options"
import { appointmentStatuses, leadStatuses } from "@/lib/domain/status"

type CustomerJobRecord = {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string
  customer?: {
    id: string
    name: string
    phone: string
    email: string
  } | null
  job?: {
    id: string
    title: string
    status: string
    estimatedValueCents: number
    capturedValueCents: number
    followUpAt: Date | string | null
    appointmentStatus: string
    appointmentAt: Date | string | null
    updatedAt: Date | string
  } | null
  source: string
  sourceDetail: string
  marketingCampaignId: string | null
  marketingCampaign?: {
    id: string
    name: string
  } | null
  status: string
  estimatedValueCents: number
  capturedValueCents: number
  notes: string
  followUpAt: Date | string | null
  followUpNote: string
  followUpCompletedAt: Date | string | null
  appointmentStatus: string
  appointmentAt: Date | string | null
  appointmentNotes: string
  createdAt: Date | string
  closedAt: Date | string | null
  serviceOfferingId: string | null
  serviceOffering?: {
    id: string
    name: string
  } | null
  missedCallAssistantIntakes: {
    status: string
    quoteRequested: boolean
    schedulingRequested: boolean
    matchedServiceName: string
  }[]
  reviewRequests: {
    id: string
  }[]
}

type CustomersJobsWorkspaceProps = {
  leads: CustomerJobRecord[]
  marketingCampaigns: {
    id: string
    name: string
    status: string
  }[]
  savedViews: CustomerJobSavedView[]
  canManageCrmViews: boolean
}

const viewOptions: { value: CustomerJobViewFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "NEEDS_ATTENTION", label: "Needs attention" },
  { value: leadStatuses.current, label: "Current" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: leadStatuses.closed, label: "Closed" },
]

const jobStatusOptions = [
  { value: "NEW", label: "New" },
  { value: "CURRENT", label: "Current" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CLOSED", label: "Closed" },
] as const

const sortOptions: { value: CustomerJobSortKey; label: string }[] = [
  { value: "NEWEST", label: "Newest first" },
  { value: "OLDEST", label: "Oldest first" },
  { value: "FOLLOW_UP", label: "Next step" },
  { value: "VALUE", label: "Money made" },
  { value: "NAME", label: "Name A-Z" },
]

const formulaFieldHelp =
  "Use fields like moneyMade, estimatedValue, openDays, reviewRequests, hasAppointment, isScheduled, and isCompleted. Example: =moneyMade*0.1"

const formulaFormats: {
  value: CustomerJobWorkbookColumnFormat
  label: string
}[] = [
  { value: "number", label: "Number" },
  { value: "money", label: "Money" },
  { value: "percent", label: "Percent" },
]

function emptyForm() {
  return {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    source: "MANUAL",
    sourceDetail: "",
    marketingCampaignId: "",
    status: leadStatuses.new,
    estimatedValue: "",
    capturedValue: "",
    followUpAt: "",
    followUpNote: "",
    appointmentStatus: appointmentStatuses.notBooked,
    appointmentAt: "",
    notes: "",
  }
}

function tokenizeFormula(expression: string) {
  const tokens: string[] = []
  let index = 0

  while (index < expression.length) {
    const character = expression[index]

    if (/\s/.test(character)) {
      index += 1
      continue
    }

    if ("+-*/()".includes(character)) {
      tokens.push(character)
      index += 1
      continue
    }

    const numberMatch = expression.slice(index).match(/^\d+(?:\.\d+)?/)

    if (numberMatch) {
      tokens.push(numberMatch[0])
      index += numberMatch[0].length
      continue
    }

    throw new Error("Formula contains unsupported characters.")
  }

  return tokens
}

function toReversePolish(tokens: string[]) {
  const output: string[] = []
  const operators: string[] = []
  const precedence: Record<string, number> = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
  }

  for (const token of tokens) {
    if (!Number.isNaN(Number(token))) {
      output.push(token)
      continue
    }

    if (token === "(") {
      operators.push(token)
      continue
    }

    if (token === ")") {
      while (operators.length > 0 && operators[operators.length - 1] !== "(") {
        output.push(operators.pop() as string)
      }

      if (operators.pop() !== "(") {
        throw new Error("Formula parentheses do not match.")
      }

      continue
    }

    while (
      operators.length > 0 &&
      operators[operators.length - 1] !== "(" &&
      precedence[operators[operators.length - 1]] >= precedence[token]
    ) {
      output.push(operators.pop() as string)
    }

    operators.push(token)
  }

  while (operators.length > 0) {
    const operator = operators.pop() as string

    if (operator === "(") {
      throw new Error("Formula parentheses do not match.")
    }

    output.push(operator)
  }

  return output
}

function evaluateReversePolish(tokens: string[]) {
  const stack: number[] = []

  for (const token of tokens) {
    if (!Number.isNaN(Number(token))) {
      stack.push(Number(token))
      continue
    }

    const right = stack.pop()
    const left = stack.pop()

    if (left === undefined || right === undefined) {
      throw new Error("Formula is incomplete.")
    }

    if (token === "+") {
      stack.push(left + right)
    } else if (token === "-") {
      stack.push(left - right)
    } else if (token === "*") {
      stack.push(left * right)
    } else if (token === "/") {
      stack.push(right === 0 ? 0 : left / right)
    }
  }

  if (stack.length !== 1 || !Number.isFinite(stack[0])) {
    throw new Error("Formula could not be calculated.")
  }

  return stack[0]
}

function timeValue(value: Date | string | null) {
  if (!value) {
    return Number.POSITIVE_INFINITY
  }

  return new Date(value).getTime()
}

function leadValue(lead: CustomerJobRecord) {
  return lead.job?.capturedValueCents && lead.job.capturedValueCents > 0
    ? lead.job.capturedValueCents
    : lead.capturedValueCents > 0
      ? lead.capturedValueCents
      : lead.job?.estimatedValueCents && lead.job.estimatedValueCents > 0
        ? lead.job.estimatedValueCents
        : lead.estimatedValueCents
}

function getOpenDays(lead: CustomerJobRecord) {
  const start = new Date(lead.createdAt).getTime()
  const end = lead.closedAt ? new Date(lead.closedAt).getTime() : Date.now()

  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)))
}

function getFormulaValues(lead: CustomerJobRecord) {
  return {
    capturedValue: lead.capturedValueCents / 100,
    estimatedValue:
      (lead.job?.estimatedValueCents ?? lead.estimatedValueCents) / 100,
    hasAppointment: getLeadAppointmentAt(lead) ? 1 : 0,
    isClosed: getEffectiveJobStatus(lead) === "CLOSED" ? 1 : 0,
    isCompleted: getEffectiveJobStatus(lead) === "COMPLETED" ? 1 : 0,
    isCurrent: getEffectiveJobStatus(lead) === "CURRENT" ? 1 : 0,
    isScheduled: getEffectiveJobStatus(lead) === "SCHEDULED" ? 1 : 0,
    moneyMade: leadValue(lead) / 100,
    openDays: getOpenDays(lead),
    reviewRequests: lead.reviewRequests.length,
  }
}

function evaluateFormulaColumn(
  column: CustomerJobWorkbookColumn,
  lead: CustomerJobRecord
) {
  const values = getFormulaValues(lead)
  const expression = column.formula
    .trim()
    .replace(/^=/, "")
    .replace(/[A-Za-z][A-Za-z0-9_]*/g, (token) => {
      const value = values[token as keyof typeof values]

      if (value === undefined) {
        throw new Error(`Unknown field: ${token}`)
      }

      return String(value)
    })

  return evaluateReversePolish(toReversePolish(tokenizeFormula(expression)))
}

function formatFormulaValue(
  value: number,
  format: CustomerJobWorkbookColumnFormat
) {
  if (format === "money") {
    return formatMoney(Math.round(value * 100))
  }

  if (format === "percent") {
    return `${Math.round(value * 1000) / 10}%`
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function getCustomerName(lead: CustomerJobRecord) {
  return lead.customer?.name || lead.customerName
}

function getCustomerPhone(lead: CustomerJobRecord) {
  return lead.customer?.phone || lead.customerPhone
}

function getCustomerEmail(lead: CustomerJobRecord) {
  return lead.customer?.email || lead.customerEmail
}

function getLeadAppointmentStatus(lead: CustomerJobRecord) {
  return lead.job?.appointmentStatus || lead.appointmentStatus
}

function getLeadAppointmentAt(lead: CustomerJobRecord) {
  return lead.job?.appointmentAt || lead.appointmentAt
}

function getLeadFollowUpAt(lead: CustomerJobRecord) {
  return lead.job?.followUpAt || lead.followUpAt
}

function getEffectiveJobStatus(lead: CustomerJobRecord) {
  if (lead.job?.status) {
    return lead.job.status
  }

  const normalizedStatus = normalizeLeadStatus(lead.status)

  if (normalizedStatus === leadStatuses.closed) {
    return "CLOSED"
  }

  if (normalizedStatus === leadStatuses.captured) {
    return "COMPLETED"
  }

  if (
    lead.appointmentStatus === appointmentStatuses.booked ||
    Boolean(lead.appointmentAt)
  ) {
    return "SCHEDULED"
  }

  if (
    normalizedStatus === leadStatuses.current ||
    normalizedStatus === leadStatuses.contacted
  ) {
    return "CURRENT"
  }

  return "NEW"
}

function needsAttention(lead: CustomerJobRecord) {
  const latestIntake = lead.missedCallAssistantIntakes[0]

  return (
    getEffectiveJobStatus(lead) === "NEW" ||
    latestIntake?.status === "READY_FOR_OWNER" ||
    getLeadAppointmentStatus(lead) === appointmentStatuses.requested
  )
}

function formatDate(value: Date | string | null) {
  if (!value) {
    return "Not set"
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function dateInputValue(value: Date | string | null) {
  if (!value) {
    return ""
  }

  return new Date(value).toISOString().slice(0, 10)
}

function dateTimeInputValue(value: Date | string | null) {
  if (!value) {
    return ""
  }

  return new Date(value).toISOString().slice(0, 16)
}

function isScheduledLead(lead: CustomerJobRecord) {
  return (
    getEffectiveJobStatus(lead) === "SCHEDULED" ||
    getLeadAppointmentStatus(lead) === appointmentStatuses.requested ||
    getLeadAppointmentStatus(lead) === appointmentStatuses.booked ||
    Boolean(getLeadAppointmentAt(lead))
  )
}

function getServiceLabel(lead: CustomerJobRecord) {
  return (
    lead.job?.title ||
    lead.serviceOffering?.name ||
    lead.missedCallAssistantIntakes[0]?.matchedServiceName ||
    lead.sourceDetail ||
    "Service not set"
  )
}

function getLeadTaskSummary(lead: CustomerJobRecord) {
  const latestIntake = lead.missedCallAssistantIntakes[0]
  const normalizedStatus = normalizeLeadStatus(lead.status)

  if (latestIntake?.status === "READY_FOR_OWNER") {
    return {
      title: "Review missed-call assistant intake",
      detail: [
        latestIntake.schedulingRequested ? "Scheduling requested" : "",
        latestIntake.quoteRequested ? "Quote requested" : "",
        latestIntake.matchedServiceName,
      ]
        .filter(Boolean)
        .join(" - "),
    }
  }

  if (isScheduledLead(lead) && normalizedStatus !== leadStatuses.captured) {
    return {
      title: getLeadAppointmentAt(lead)
        ? `Confirm ${formatDate(getLeadAppointmentAt(lead))}`
        : "Confirm appointment",
      detail:
        appointmentStatusLabels[getLeadAppointmentStatus(lead)] ??
        "Appointment requested",
    }
  }

  if (normalizedStatus === leadStatuses.new) {
    return {
      title: "Respond and qualify",
      detail: lead.notes || "Open the record to add the next step.",
    }
  }

  if (normalizedStatus === leadStatuses.current) {
    return {
      title: getLeadFollowUpAt(lead)
        ? `Follow up ${formatDate(getLeadFollowUpAt(lead))}`
        : "Set next step",
      detail: lead.followUpNote || "Keep the customer moving.",
    }
  }

  if (normalizedStatus === leadStatuses.captured) {
    return {
      title:
        lead.reviewRequests.length > 0
          ? "Track review request"
          : "Send review request",
      detail: `${lead.reviewRequests.length} review request${
        lead.reviewRequests.length === 1 ? "" : "s"
      }`,
    }
  }

  if (normalizedStatus === leadStatuses.closed) {
    return {
      title: "No active work",
      detail: "Reopen if the customer becomes active again.",
    }
  }

  return {
    title: "Review record",
    detail: "Open the record to choose the next step.",
  }
}

function getJobStatus(lead: CustomerJobRecord) {
  const latestIntake = lead.missedCallAssistantIntakes[0]
  const normalizedStatus = normalizeLeadStatus(lead.status)

  if (getEffectiveJobStatus(lead) === "CLOSED") {
    return {
      label: "Closed",
      detail: "No active work",
      className: "bg-lr-hover text-lr-muted",
    }
  }

  if (getEffectiveJobStatus(lead) === "COMPLETED") {
    return {
      label: "Completed",
      detail: "Ready for review request",
      className: "bg-emerald-50 text-emerald-700",
    }
  }

  if (getEffectiveJobStatus(lead) === "SCHEDULED") {
    return {
      label: "Booked job",
      detail: getLeadAppointmentAt(lead)
        ? formatDate(getLeadAppointmentAt(lead))
        : "On calendar",
      className: "bg-sky-50 text-sky-700",
    }
  }

  if (getEffectiveJobStatus(lead) === "CURRENT") {
    return {
      label: "Current",
      detail: getLeadFollowUpAt(lead)
        ? `Next ${formatDate(getLeadFollowUpAt(lead))}`
        : "In progress",
      className: "bg-blue-50 text-blue-700",
    }
  }

  if (normalizedStatus === leadStatuses.closed) {
    return {
      label: "Closed",
      detail: "No active work",
      className: "bg-lr-hover text-lr-muted",
    }
  }

  if (normalizedStatus === leadStatuses.captured) {
    return {
      label: "Captured",
      detail: "Job value recorded",
      className: "bg-emerald-50 text-emerald-700",
    }
  }

  if (
    getLeadAppointmentStatus(lead) === appointmentStatuses.booked ||
    getLeadAppointmentAt(lead)
  ) {
    return {
      label: "Booked job",
      detail: getLeadAppointmentAt(lead)
        ? formatDate(getLeadAppointmentAt(lead))
        : "On calendar",
      className: "bg-sky-50 text-sky-700",
    }
  }

  if (getLeadAppointmentStatus(lead) === appointmentStatuses.requested) {
    return {
      label: "Requested",
      detail: "Needs scheduling",
      className: "bg-amber-50 text-amber-700",
    }
  }

  if (latestIntake?.status === "READY_FOR_OWNER") {
    return {
      label: "Needs review",
      detail: "missed-call assistant intake ready",
      className: "bg-violet-50 text-violet-700",
    }
  }

  if (normalizedStatus === leadStatuses.current) {
    return {
      label: "Current",
      detail: getLeadFollowUpAt(lead)
        ? `Next ${formatDate(getLeadFollowUpAt(lead))}`
        : "In progress",
      className: "bg-blue-50 text-blue-700",
    }
  }

  return {
    label: "New",
    detail: "Needs first action",
    className: "bg-amber-50 text-amber-700",
  }
}

function getLastActivity(lead: CustomerJobRecord) {
  if (lead.closedAt) {
    return `Closed ${formatDate(lead.closedAt)}`
  }

  if (getLeadAppointmentAt(lead)) {
    return `Appointment ${formatDate(getLeadAppointmentAt(lead))}`
  }

  if (getLeadFollowUpAt(lead)) {
    return `Next step ${formatDate(getLeadFollowUpAt(lead))}`
  }

  return `Created ${formatDate(lead.createdAt)}`
}

function getViewCount(leads: CustomerJobRecord[], view: string) {
  return leads.filter((lead) => {
    if (view === "ALL") {
      return true
    }

    if (view === "NEEDS_ATTENTION") {
      return needsAttention(lead)
    }

    if (view === "SCHEDULED") {
      return isScheduledLead(lead)
    }

    if (view === "COMPLETED") {
      return getEffectiveJobStatus(lead) === "COMPLETED"
    }

    if (view === "NO_FOLLOW_UP") {
      return (
        getEffectiveJobStatus(lead) !== "CLOSED" &&
        getEffectiveJobStatus(lead) !== "COMPLETED" &&
        !getLeadFollowUpAt(lead)
      )
    }

    return normalizeLeadStatus(lead.status) === view
  }).length
}

export function CustomersJobsWorkspace({
  leads,
  marketingCampaigns,
  savedViews,
  canManageCrmViews,
}: CustomersJobsWorkspaceProps) {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm())
  const [savedViewList, setSavedViewList] = useState(savedViews)
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(null)
  const [filters, setFilters] =
    useState<CustomerJobViewFilters>(defaultCustomerJobFilters)
  const [sortBy, setSortBy] = useState<CustomerJobSortKey>("NEWEST")
  const [visibleColumns, setVisibleColumns] = useState<CustomerJobColumnKey[]>(
    defaultCustomerJobColumns
  )
  const [customColumns, setCustomColumns] = useState<
    CustomerJobWorkbookColumn[]
  >([])
  const [columnWidths, setColumnWidths] = useState<CustomerJobColumnWidths>({})
  const [newColumnLabel, setNewColumnLabel] = useState("")
  const [newColumnFormula, setNewColumnFormula] = useState("=moneyMade")
  const [newColumnFormat, setNewColumnFormat] =
    useState<CustomerJobWorkbookColumnFormat>("number")
  const [showManualLeadEntry, setShowManualLeadEntry] = useState(false)
  const [showColumnPicker, setShowColumnPicker] = useState(false)
  const [newViewName, setNewViewName] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [viewSaving, setViewSaving] = useState(false)

  const activeSavedView = savedViewList.find(
    (view) => view.id === activeSavedViewId
  )
  const visibleCustomColumns = customColumns.filter((column) => column.visible)
  const visibleColumnIds = [
    ...visibleColumns,
    ...visibleCustomColumns.map((column) => column.id),
  ]

  const filteredLeads = useMemo(() => {
    const normalizedSearch = filters.searchTerm.trim().toLowerCase()
    const matchingLeads = leads.filter((lead) => {
      const normalizedStatus = normalizeLeadStatus(lead.status)
      const viewMatches =
        filters.viewFilter === "ALL" ||
        (filters.viewFilter === "NEEDS_ATTENTION" && needsAttention(lead)) ||
        (filters.viewFilter === "SCHEDULED" && isScheduledLead(lead)) ||
        (filters.viewFilter === "COMPLETED" &&
          getEffectiveJobStatus(lead) === "COMPLETED") ||
        (filters.viewFilter === "NO_FOLLOW_UP" &&
          getEffectiveJobStatus(lead) !== "CLOSED" &&
          getEffectiveJobStatus(lead) !== "COMPLETED" &&
          !getLeadFollowUpAt(lead)) ||
        normalizedStatus === filters.viewFilter
      const sourceMatches =
        filters.sourceFilter === "ALL" || lead.source === filters.sourceFilter

      if (!viewMatches || !sourceMatches) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [
        getCustomerName(lead),
        getCustomerPhone(lead),
        getCustomerEmail(lead),
        getServiceLabel(lead),
        lead.job?.status ?? "",
        lead.notes,
        lead.sourceDetail,
        lead.marketingCampaign?.name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    })

    return [...matchingLeads].sort((left, right) => {
      if (sortBy === "OLDEST") {
        return (
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime()
        )
      }

      if (sortBy === "FOLLOW_UP") {
        return (
          timeValue(getLeadFollowUpAt(left)) -
          timeValue(getLeadFollowUpAt(right)) ||
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        )
      }

      if (sortBy === "VALUE") {
        return leadValue(right) - leadValue(left)
      }

      if (sortBy === "NAME") {
        return getCustomerName(left).localeCompare(getCustomerName(right))
      }

      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )
    })
  }, [filters, leads, sortBy])

  const workspaceSummary = useMemo(() => {
    const needsAttentionCount = leads.filter((lead) => needsAttention(lead)).length
    const bookedJobs = leads.filter(
      (lead) =>
        getEffectiveJobStatus(lead) === "SCHEDULED" ||
        getLeadAppointmentStatus(lead) === appointmentStatuses.booked ||
        Boolean(getLeadAppointmentAt(lead))
    ).length
    const capturedJobs = leads.filter(
      (lead) =>
        getEffectiveJobStatus(lead) === "COMPLETED" ||
        normalizeLeadStatus(lead.status) === leadStatuses.captured
    ).length
    const moneyMade = leads.reduce(
      (sum, lead) => sum + (lead.job?.capturedValueCents ?? lead.capturedValueCents),
      0
    )

    return [
      {
        label: "Needs attention",
        value: needsAttentionCount.toString(),
        detail: "New, requested, or needs review",
      },
      {
        label: "Booked jobs",
        value: bookedJobs.toString(),
        detail: "Scheduled or on calendar",
      },
      {
        label: "Completed jobs",
        value: capturedJobs.toString(),
        detail: "Completed value recorded",
      },
      {
        label: "Money made",
        value: formatMoney(moneyMade),
        detail: "Captured value only",
      },
    ]
  }, [leads])

  function updateForm(field: keyof ReturnType<typeof emptyForm>, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  function updateFilters(nextFilters: Partial<CustomerJobViewFilters>) {
    setActiveSavedViewId(null)
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
    }))
  }

  function updateSort(nextSort: CustomerJobSortKey) {
    setActiveSavedViewId(null)
    setSortBy(nextSort)
  }

  function toggleColumn(column: CustomerJobColumnKey) {
    setActiveSavedViewId(null)
    setVisibleColumns((currentColumns) => {
      if (currentColumns.includes(column)) {
        const nextColumns = currentColumns.filter((item) => item !== column)
        return nextColumns.length > 0 ? nextColumns : currentColumns
      }

      return [...currentColumns, column]
    })
  }

  function updateColumnWidth(columnId: string, width: number) {
    setActiveSavedViewId(null)
    setColumnWidths((currentWidths) => ({
      ...currentWidths,
      [columnId]: Math.max(90, Math.min(520, Math.round(width))),
    }))
  }

  function startColumnResize(
    event: React.MouseEvent<HTMLButtonElement>,
    columnId: string
  ) {
    event.preventDefault()
    const startX = event.clientX
    const startWidth =
      columnWidths[columnId] || getDefaultCustomerJobColumnWidth(columnId)

    function handleMove(moveEvent: MouseEvent) {
      updateColumnWidth(columnId, startWidth + moveEvent.clientX - startX)
    }

    function handleUp() {
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseup", handleUp)
    }

    document.addEventListener("mousemove", handleMove)
    document.addEventListener("mouseup", handleUp)
  }

  function addCustomColumn() {
    const label = newColumnLabel.trim()
    const formula = newColumnFormula.trim()

    if (!label || !formula) {
      setMessage("Name the column and add a formula first.")
      return
    }

    setActiveSavedViewId(null)
    const id = `formula-${Date.now().toString(36)}`
    setCustomColumns((currentColumns) => [
      ...currentColumns,
      {
        id,
        label,
        formula,
        format: newColumnFormat,
        visible: true,
        width: 160,
      },
    ])
    setColumnWidths((currentWidths) => ({
      ...currentWidths,
      [id]: 160,
    }))
    setNewColumnLabel("")
    setNewColumnFormula("=moneyMade")
    setNewColumnFormat("number")
    setMessage("Workbook formula column added. Save the view to keep it.")
  }

  function toggleCustomColumn(columnId: string) {
    setActiveSavedViewId(null)
    setCustomColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId
          ? { ...column, visible: !column.visible }
          : column
      )
    )
  }

  function deleteCustomColumn(columnId: string) {
    setActiveSavedViewId(null)
    setCustomColumns((currentColumns) =>
      currentColumns.filter((column) => column.id !== columnId)
    )
    setColumnWidths((currentWidths) => {
      const nextWidths = { ...currentWidths }
      delete nextWidths[columnId]
      return nextWidths
    })
  }

  function applyBuiltInView(viewFilter: CustomerJobViewFilter) {
    setActiveSavedViewId(null)
    setFilters({
      viewFilter,
      sourceFilter: "ALL",
      searchTerm: "",
    })
    setSortBy("NEWEST")
    setVisibleColumns(defaultCustomerJobColumns)
    setCustomColumns([])
    setColumnWidths({})
  }

  function applySavedView(view: CustomerJobSavedView) {
    setActiveSavedViewId(view.id)
    setFilters(view.filters)
    setSortBy(view.sortKey)
    setVisibleColumns(view.visibleColumns)
    setCustomColumns(view.customColumns)
    setColumnWidths(view.columnWidths)
    setShowColumnPicker(false)
  }

  async function saveCurrentView() {
    if (!canManageCrmViews) {
      return
    }

    setViewSaving(true)
    setMessage("")

    try {
      const res = await fetch("/api/crm-views", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newViewName,
          filters,
          visibleColumns,
          customColumns,
          columnWidths,
          sortKey: sortBy,
          sortDirection: "DESC",
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Could not save this view.")
        return
      }

      setSavedViewList((currentViews) => [data.view, ...currentViews])
      setActiveSavedViewId(data.view.id)
      setNewViewName("")
      setMessage("Workspace view saved.")
      router.refresh()
    } catch {
      setMessage("Could not save this view.")
    } finally {
      setViewSaving(false)
    }
  }

  async function updateCurrentView() {
    if (!canManageCrmViews || !activeSavedView) {
      return
    }

    setViewSaving(true)
    setMessage("")

    try {
      const res = await fetch(`/api/crm-views/${activeSavedView.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters,
          visibleColumns,
          customColumns,
          columnWidths,
          sortKey: sortBy,
          sortDirection: "DESC",
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Could not update this view.")
        return
      }

      setSavedViewList((currentViews) =>
        currentViews.map((view) =>
          view.id === activeSavedView.id ? data.view : view
        )
      )
      setMessage("Workspace view updated.")
      router.refresh()
    } catch {
      setMessage("Could not update this view.")
    } finally {
      setViewSaving(false)
    }
  }

  async function deleteCurrentView() {
    if (!canManageCrmViews || !activeSavedView) {
      return
    }

    setViewSaving(true)
    setMessage("")

    try {
      const res = await fetch(`/api/crm-views/${activeSavedView.id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Could not delete this view.")
        return
      }

      setSavedViewList((currentViews) =>
        currentViews.filter((view) => view.id !== activeSavedView.id)
      )
      applyBuiltInView("ALL")
      setMessage("Workspace view deleted.")
      router.refresh()
    } catch {
      setMessage("Could not delete this view.")
    } finally {
      setViewSaving(false)
    }
  }

  async function handleCreateLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setForm(emptyForm())
      setMessage("Customer/job added.")
      setShowManualLeadEntry(false)
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function quickUpdateStatus(lead: CustomerJobRecord, status: string) {
    setMessage("")

    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: getCustomerName(lead),
          customerPhone: getCustomerPhone(lead),
          customerEmail: getCustomerEmail(lead),
          source: lead.source,
          sourceDetail: lead.sourceDetail,
          marketingCampaignId: lead.marketingCampaignId ?? "",
          status,
          estimatedValue: centsToDollars(lead.estimatedValueCents),
          capturedValue: centsToDollars(
            status === leadStatuses.captured && lead.capturedValueCents === 0
              ? lead.estimatedValueCents
              : lead.capturedValueCents
          ),
          notes: lead.notes,
          followUpAt: dateInputValue(lead.followUpAt),
          followUpNote: lead.followUpNote,
          followUpCompleted: Boolean(lead.followUpCompletedAt),
          appointmentStatus: lead.appointmentStatus,
          appointmentAt: dateTimeInputValue(lead.appointmentAt),
          appointmentNotes: lead.appointmentNotes,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Customer/job updated.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    }
  }

  async function quickUpdateJobStatus(lead: CustomerJobRecord, jobStatus: string) {
    const nextLeadStatus =
      jobStatus === "CLOSED"
        ? leadStatuses.closed
        : jobStatus === "COMPLETED"
          ? leadStatuses.captured
          : jobStatus === "CURRENT" || jobStatus === "SCHEDULED"
            ? leadStatuses.current
            : leadStatuses.new
    const nextAppointmentStatus =
      jobStatus === "SCHEDULED" && getLeadAppointmentStatus(lead) === appointmentStatuses.notBooked
        ? appointmentStatuses.booked
        : jobStatus === "NEW" || jobStatus === "CURRENT"
          ? appointmentStatuses.notBooked
          : getLeadAppointmentStatus(lead)

    await quickUpdateStatusWithFields(lead, {
      status: nextLeadStatus,
      appointmentStatus: nextAppointmentStatus,
      capturedValueCents:
        jobStatus === "COMPLETED" && leadValue(lead) > 0
          ? leadValue(lead)
          : lead.capturedValueCents,
    })
  }

  async function quickUpdateStatusWithFields(
    lead: CustomerJobRecord,
    overrides: {
      status: string
      appointmentStatus?: string
      capturedValueCents?: number
    }
  ) {
    setMessage("")

    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: getCustomerName(lead),
          customerPhone: getCustomerPhone(lead),
          customerEmail: getCustomerEmail(lead),
          source: lead.source,
          sourceDetail: lead.sourceDetail,
          marketingCampaignId: lead.marketingCampaignId ?? "",
          status: overrides.status,
          estimatedValue: centsToDollars(lead.estimatedValueCents),
          capturedValue: centsToDollars(
            overrides.capturedValueCents ?? lead.capturedValueCents
          ),
          notes: lead.notes,
          followUpAt: dateInputValue(getLeadFollowUpAt(lead)),
          followUpNote: lead.followUpNote,
          followUpCompleted: Boolean(lead.followUpCompletedAt),
          appointmentStatus:
            overrides.appointmentStatus ?? getLeadAppointmentStatus(lead),
          appointmentAt: dateTimeInputValue(getLeadAppointmentAt(lead)),
          appointmentNotes: lead.appointmentNotes,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.")
        return
      }

      setMessage("Customer/job updated.")
      router.refresh()
    } catch {
      setMessage("Something went wrong.")
    }
  }

  function renderCell(column: CustomerJobColumnKey, lead: CustomerJobRecord) {
    const taskSummary = getLeadTaskSummary(lead)

    if (column === "customer") {
      return (
        <div>
          <Link
            href={`/leads/${lead.id}`}
            className="font-black text-lr-strong hover:text-lr-primary"
          >
            {getCustomerName(lead)}
          </Link>
          <p className="mt-1 text-xs text-lr-muted">
            {visibleColumns.includes("phone")
              ? getCustomerEmail(lead) || "No email"
              : [getCustomerPhone(lead), getCustomerEmail(lead)]
                  .filter(Boolean)
                  .join(" - ")}
          </p>
        </div>
      )
    }

    if (column === "phone") {
      return (
        <span className="font-semibold text-lr-body">
          {getCustomerPhone(lead)}
        </span>
      )
    }

    if (column === "service") {
      return (
        <div>
          <p className="font-bold text-lr-body">{getServiceLabel(lead)}</p>
          {isScheduledLead(lead) && (
            <p className="mt-2 w-fit rounded-md bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700">
              Scheduled
            </p>
          )}
        </div>
      )
    }

    if (column === "status") {
      return (
        <select
          value={normalizeLeadStatus(lead.status)}
          onChange={(e) => quickUpdateStatus(lead, e.target.value)}
          className={`rounded-lg border border-transparent px-2 py-1 text-xs font-bold outline-none ${statusClassName(
            normalizeLeadStatus(lead.status)
          )}`}
        >
          {leadStatusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      )
    }

    if (column === "jobStatus") {
      const jobStatus = getJobStatus(lead)

      return (
        <div>
          <select
            value={getEffectiveJobStatus(lead)}
            onChange={(e) => quickUpdateJobStatus(lead, e.target.value)}
            className={`rounded-lg border border-transparent px-2 py-1 text-xs font-black outline-none ${jobStatus.className}`}
          >
            {jobStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-lr-muted">{jobStatus.detail}</p>
        </div>
      )
    }

    if (column === "appointment") {
      const appointmentAt = getLeadAppointmentAt(lead)
      const appointmentStatus =
        appointmentStatusLabels[getLeadAppointmentStatus(lead)] ??
        getLeadAppointmentStatus(lead)

      return (
        <div>
          <p className="font-bold text-lr-body">
            {appointmentAt ? formatDate(appointmentAt) : "Not scheduled"}
          </p>
          <p className="mt-1 text-xs text-lr-muted">{appointmentStatus}</p>
        </div>
      )
    }

    if (column === "nextStep") {
      return (
        <div>
          <p className="font-bold text-lr-strong">{taskSummary.title}</p>
          <p className="mt-1 max-w-[260px] text-xs text-lr-muted">
            {taskSummary.detail}
          </p>
        </div>
      )
    }

    if (column === "lastActivity") {
      return <span className="text-lr-muted">{getLastActivity(lead)}</span>
    }

    if (column === "moneyMade") {
      return (
        <span className="font-black text-lr-strong">
          {formatMoney(leadValue(lead))}
        </span>
      )
    }

    if (column === "source") {
      return (
        <div>
          <p className="font-bold text-lr-body">
            {leadSourceLabels[lead.source] ?? lead.source}
          </p>
          <p className="mt-1 text-xs text-lr-subtle">
            {lead.sourceDetail || "No detail"}
          </p>
        </div>
      )
    }

    if (column === "campaign") {
      return (
        <span className="text-lr-muted">
          {lead.marketingCampaign?.name || "No campaign"}
        </span>
      )
    }

    if (column === "assigned") {
      return <span className="text-lr-muted">Owner</span>
    }

    return (
      <Link
        href={`/leads/${lead.id}`}
        className="rounded-lg border border-lr-border bg-lr-surface px-3 py-2 text-xs font-bold text-lr-body hover:bg-lr-hover hover:text-lr-strong"
      >
        Open
      </Link>
    )
  }

  function renderCustomCell(
    column: CustomerJobWorkbookColumn,
    lead: CustomerJobRecord
  ) {
    try {
      const value = evaluateFormulaColumn(column, lead)

      return (
        <span className="font-black text-lr-strong">
          {formatFormulaValue(value, column.format)}
        </span>
      )
    } catch {
      return (
        <span className="text-xs font-bold text-amber-700">
          Check formula
        </span>
      )
    }
  }

  function getColumnWidth(columnId: string) {
    return columnWidths[columnId] || getDefaultCustomerJobColumnWidth(columnId)
  }

  function renderMobileCard(lead: CustomerJobRecord) {
    const taskSummary = getLeadTaskSummary(lead)
    const jobStatus = getJobStatus(lead)
    const appointmentAt = getLeadAppointmentAt(lead)

    return (
      <article
        key={lead.id}
        className="rounded-xl border border-lr-border bg-lr-surface p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/leads/${lead.id}`}
              className="text-base font-black text-lr-strong hover:text-lr-primary"
            >
              {getCustomerName(lead)}
            </Link>
            <p className="mt-1 text-sm font-semibold text-lr-muted">
              {getCustomerPhone(lead) || "No phone"}
            </p>
          </div>
          <Link
            href={`/leads/${lead.id}`}
            className="shrink-0 rounded-lg border border-lr-border bg-lr-surface-muted px-3 py-2 text-xs font-bold text-lr-body hover:bg-lr-hover hover:text-lr-strong"
          >
            Open
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-lr-subtle">
              Service/job
            </p>
            <p className="mt-1 font-bold text-lr-body">
              {getServiceLabel(lead)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-lr-subtle">
                Status
              </p>
              <select
                value={getEffectiveJobStatus(lead)}
                onChange={(e) => quickUpdateJobStatus(lead, e.target.value)}
                className={`mt-1 w-full rounded-lg border border-transparent px-2 py-2 text-xs font-black outline-none ${jobStatus.className}`}
              >
                {jobStatusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-lr-muted">
                {jobStatus.detail}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wide text-lr-subtle">
                Money made
              </p>
              <p className="mt-2 text-lg font-black text-lr-strong">
                {formatMoney(leadValue(lead))}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wide text-lr-subtle">
              Next step
            </p>
            <p className="mt-1 font-bold text-lr-strong">
              {taskSummary.title}
            </p>
            <p className="mt-1 text-sm text-lr-muted">
              {taskSummary.detail}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-lr-subtle">
                Appointment
              </p>
              <p className="mt-1 text-sm font-bold text-lr-body">
                {appointmentAt ? formatDate(appointmentAt) : "Not scheduled"}
              </p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-lr-subtle">
                Last activity
              </p>
              <p className="mt-1 text-sm font-bold text-lr-body">
                {getLastActivity(lead)}
              </p>
            </div>
          </div>

          {visibleCustomColumns.length > 0 && (
            <div className="grid gap-3 border-t border-lr-border pt-3 sm:grid-cols-2">
              {visibleCustomColumns.map((column) => (
                <div key={column.id}>
                  <p className="text-xs font-black uppercase tracking-wide text-lr-subtle">
                    {column.label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-lr-body">
                    {renderCustomCell(column, lead)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>
    )
  }

  return (
    <div className="mt-7 space-y-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {workspaceSummary.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-lr-border bg-lr-surface-muted p-4"
          >
            <p className="text-xs font-black uppercase tracking-wide text-lr-subtle">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-black text-lr-strong">
              {item.value}
            </p>
            <p className="mt-1 text-xs text-lr-muted">{item.detail}</p>
          </div>
        ))}
      </section>

      <div className="rounded-xl border border-lr-border bg-lr-surface-muted p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-lr-subtle">
              Views
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {viewOptions.map((view) => {
                const active =
                  !activeSavedViewId &&
                  filters.viewFilter === view.value &&
                  filters.sourceFilter === "ALL" &&
                  !filters.searchTerm

                return (
                  <button
                    key={view.value}
                    type="button"
                    onClick={() => applyBuiltInView(view.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                      active
                        ? "border-lr-primary bg-lr-primary text-lr-on-primary"
                        : "border-lr-border bg-lr-surface text-lr-body hover:bg-lr-hover"
                    }`}
                  >
                    {view.label}
                    <span className="ml-2 opacity-75">
                      {getViewCount(leads, view.value)}
                    </span>
                  </button>
                )
              })}
              {savedViewList.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => applySavedView(view)}
                  className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                    activeSavedViewId === view.id
                      ? "border-lr-primary bg-lr-primary text-lr-on-primary"
                      : "border-lr-border bg-lr-surface text-lr-body hover:bg-lr-hover"
                  }`}
                >
                  {view.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-expanded={showManualLeadEntry}
              onClick={() => setShowManualLeadEntry((isOpen) => !isOpen)}
              className="rounded-lg bg-lr-primary px-4 py-2 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover"
            >
              {showManualLeadEntry ? "Hide entry" : "Add customer/job"}
            </button>
            <button
              type="button"
              aria-expanded={showColumnPicker}
              onClick={() => setShowColumnPicker((isOpen) => !isOpen)}
              className="rounded-lg border border-lr-border bg-lr-surface px-4 py-2 text-sm font-bold text-lr-body hover:bg-lr-hover"
            >
              Columns ({visibleColumnIds.length})
            </button>
            <Link
              href="/leads/import"
              className="rounded-lg border border-lr-border bg-lr-surface px-4 py-2 text-sm font-bold text-lr-body hover:bg-lr-hover"
            >
              Import CSV
            </Link>
          </div>
        </div>
      </div>

      {showColumnPicker && (
        <section className="rounded-xl border border-lr-border bg-lr-surface p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-lg font-black text-lr-strong">
                Customize columns
              </h2>
              <p className="mt-1 text-sm text-lr-muted">
                Choose what this workspace table shows. Save the view when the
                layout is useful for the team.
              </p>
            </div>
            {canManageCrmViews && (
              <div className="grid gap-2 sm:grid-cols-[minmax(180px,260px)_auto_auto_auto]">
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="View name"
                  className="rounded-lg border border-lr-border-strong bg-lr-field px-3 py-2 text-sm outline-none focus:border-lr-strong"
                />
                <button
                  type="button"
                  disabled={viewSaving || !newViewName.trim()}
                  onClick={saveCurrentView}
                  className="rounded-lg bg-lr-primary px-4 py-2 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  type="button"
                  disabled={viewSaving || !activeSavedView}
                  onClick={updateCurrentView}
                  className="rounded-lg border border-lr-border bg-lr-surface px-4 py-2 text-sm font-bold text-lr-body hover:bg-lr-hover disabled:opacity-60"
                >
                  Update
                </button>
                <button
                  type="button"
                  disabled={viewSaving || !activeSavedView}
                  onClick={deleteCurrentView}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {customerJobColumnKeys.map((column) => {
              const selected = visibleColumns.includes(column)

              return (
                <button
                  key={column}
                  type="button"
                  onClick={() => toggleColumn(column)}
                  className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                    selected
                      ? "border-lr-primary bg-lr-primary text-lr-on-primary"
                      : "border-lr-border bg-lr-surface text-lr-body hover:bg-lr-hover"
                  }`}
                >
                  {customerJobColumnLabels[column]}
                </button>
              )
            })}
          </div>

          <div className="mt-6 grid gap-4 rounded-xl border border-lr-border bg-lr-surface-muted p-4 lg:grid-cols-[minmax(160px,1fr)_minmax(220px,2fr)_160px_auto]">
            <label className="block text-sm font-semibold text-lr-body">
              New column
              <input
                type="text"
                value={newColumnLabel}
                onChange={(e) => setNewColumnLabel(e.target.value)}
                placeholder="Gross margin"
                className="mt-1 w-full rounded-lg border border-lr-border-strong bg-lr-field px-3 py-2 outline-none focus:border-lr-strong"
              />
            </label>
            <label className="block text-sm font-semibold text-lr-body">
              Formula
              <input
                type="text"
                value={newColumnFormula}
                onChange={(e) => setNewColumnFormula(e.target.value)}
                placeholder="=moneyMade*0.35"
                className="mt-1 w-full rounded-lg border border-lr-border-strong bg-lr-field px-3 py-2 outline-none focus:border-lr-strong"
              />
            </label>
            <label className="block text-sm font-semibold text-lr-body">
              Format
              <select
                value={newColumnFormat}
                onChange={(e) =>
                  setNewColumnFormat(
                    e.target.value as CustomerJobWorkbookColumnFormat
                  )
                }
                className="mt-1 w-full rounded-lg border border-lr-border-strong bg-lr-surface px-3 py-2 outline-none focus:border-lr-strong"
              >
                {formulaFormats.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={addCustomColumn}
                className="w-full rounded-lg bg-lr-primary px-4 py-2 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover"
              >
                Add column
              </button>
            </div>
            <p className="text-xs font-semibold text-lr-muted lg:col-span-4">
              {formulaFieldHelp}
            </p>
          </div>

          {customColumns.length > 0 && (
            <div className="mt-4 grid gap-2">
              {customColumns.map((column) => (
                <div
                  key={column.id}
                  className="flex flex-col gap-3 rounded-xl border border-lr-border bg-lr-surface-muted p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-black text-lr-strong">
                      {column.label}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-lr-muted">
                      {column.formula} · {column.format}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCustomColumn(column.id)}
                      className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                        column.visible
                          ? "border-lr-primary bg-lr-primary text-lr-on-primary"
                          : "border-lr-border bg-lr-surface text-lr-body hover:bg-lr-hover"
                      }`}
                    >
                      {column.visible ? "Visible" : "Hidden"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCustomColumn(column.id)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {message && (
        <p className="rounded-xl border border-lr-border bg-lr-surface-muted px-4 py-3 text-sm text-lr-body">
          {message}
        </p>
      )}

      {showManualLeadEntry && (
        <form
          onSubmit={handleCreateLead}
          className="rounded-xl border border-lr-border bg-lr-surface p-5"
        >
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <h2 className="text-xl font-black text-lr-strong">
                Add customer/job
              </h2>
              <p className="mt-1 text-sm text-lr-muted">
                Use this only when a customer comes from outside the automatic
                missed-call or website flows.
              </p>
            </div>
            {marketingCampaigns.length > 0 && (
              <Link
                href="/growth"
                className="text-sm font-bold text-lr-muted hover:text-lr-strong"
              >
                Manage campaigns
              </Link>
            )}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <label className="block text-sm font-semibold text-lr-body">
              Name
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => updateForm("customerName", e.target.value)}
                className="mt-1 w-full rounded-lg border border-lr-border-strong bg-lr-field px-3 py-2 outline-none focus:border-lr-strong"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-lr-body">
              Phone
              <input
                type="tel"
                value={form.customerPhone}
                onChange={(e) => updateForm("customerPhone", e.target.value)}
                className="mt-1 w-full rounded-lg border border-lr-border-strong bg-lr-field px-3 py-2 outline-none focus:border-lr-strong"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-lr-body">
              Email
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => updateForm("customerEmail", e.target.value)}
                className="mt-1 w-full rounded-lg border border-lr-border-strong bg-lr-field px-3 py-2 outline-none focus:border-lr-strong"
              />
            </label>
            <label className="block text-sm font-semibold text-lr-body">
              Source
              <select
                value={form.source}
                onChange={(e) => updateForm("source", e.target.value)}
                className="mt-1 w-full rounded-lg border border-lr-border-strong bg-lr-surface px-3 py-2 outline-none focus:border-lr-strong"
              >
                {leadSourceOptions.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-lr-body">
              Status
              <select
                value={form.status}
                onChange={(e) => updateForm("status", e.target.value)}
                className="mt-1 w-full rounded-lg border border-lr-border-strong bg-lr-surface px-3 py-2 outline-none focus:border-lr-strong"
              >
                {leadStatusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-lr-body">
              Money made
              <input
                type="number"
                min="0"
                value={form.capturedValue}
                onChange={(e) => updateForm("capturedValue", e.target.value)}
                className="mt-1 w-full rounded-lg border border-lr-border-strong bg-lr-field px-3 py-2 outline-none focus:border-lr-strong"
                placeholder="Only after job is won"
              />
            </label>
            <label className="block text-sm font-semibold text-lr-body lg:col-span-2">
              Service or source detail
              <input
                type="text"
                value={form.sourceDetail}
                onChange={(e) => updateForm("sourceDetail", e.target.value)}
                className="mt-1 w-full rounded-lg border border-lr-border-strong bg-lr-field px-3 py-2 outline-none focus:border-lr-strong"
                placeholder="Drain repair, roof inspection, Facebook referral"
              />
            </label>
            <label className="block text-sm font-semibold text-lr-body">
              Appointment
              <input
                type="datetime-local"
                value={form.appointmentAt}
                onChange={(e) => updateForm("appointmentAt", e.target.value)}
                className="mt-1 w-full rounded-lg border border-lr-border-strong bg-lr-field px-3 py-2 outline-none focus:border-lr-strong"
              />
            </label>
            <label className="block text-sm font-semibold text-lr-body lg:col-span-3">
              Note
              <textarea
                value={form.notes}
                onChange={(e) => updateForm("notes", e.target.value)}
                className="mt-1 min-h-24 w-full rounded-lg border border-lr-border-strong bg-lr-field px-3 py-2 outline-none focus:border-lr-strong"
                placeholder="What happened, what they need, and what should happen next."
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-lr-primary px-4 py-2 text-sm font-bold text-lr-on-primary hover:bg-lr-primary-hover disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save customer/job"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowManualLeadEntry(false)}
              className="rounded-lg border border-lr-border bg-lr-surface px-4 py-2 text-sm font-bold text-lr-body hover:bg-lr-hover disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3 rounded-xl border border-lr-border bg-lr-surface p-4 lg:grid-cols-[minmax(260px,1fr)_220px_220px]">
        <input
          type="search"
          value={filters.searchTerm}
          onChange={(e) => updateFilters({ searchTerm: e.target.value })}
          placeholder="Search customers, service, phone, notes..."
          className="w-full rounded-lg border border-lr-border-strong bg-lr-field px-3 py-2 text-sm outline-none focus:border-lr-strong"
        />
        <select
          value={filters.sourceFilter}
          onChange={(e) => updateFilters({ sourceFilter: e.target.value })}
          className="w-full rounded-lg border border-lr-border-strong bg-lr-surface px-3 py-2 text-sm outline-none focus:border-lr-strong"
        >
          <option value="ALL">All sources</option>
          {leadSourceOptions.map((source) => (
            <option key={source.value} value={source.value}>
              {source.label}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => updateSort(e.target.value as CustomerJobSortKey)}
          className="w-full rounded-lg border border-lr-border-strong bg-lr-surface px-3 py-2 text-sm outline-none focus:border-lr-strong"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-lr-border bg-lr-surface">
        <div className="border-b border-lr-border bg-lr-surface-muted px-4 py-3 text-sm text-lr-muted">
          Showing{" "}
          <span className="font-black text-lr-strong">
            {filteredLeads.length}
          </span>{" "}
          of {leads.length} customers/jobs
          {activeSavedView ? ` in ${activeSavedView.name}` : ""}
        </div>
        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-lg font-black text-lr-strong">
              No customers/jobs found
            </p>
            <p className="mt-2 text-sm text-lr-muted">
              Change the view, clear search, or add a customer/job.
            </p>
            <button
              type="button"
              onClick={() => applyBuiltInView("ALL")}
              className="mt-4 rounded-lg border border-lr-border bg-lr-surface px-4 py-2 text-sm font-bold text-lr-body hover:bg-lr-hover"
            >
              Reset view
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {filteredLeads.map((lead) => renderMobileCard(lead))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table
                className="w-full border-collapse text-left text-sm"
                style={{
                  minWidth: visibleColumnIds.reduce(
                    (total, columnId) => total + getColumnWidth(columnId),
                    0
                  ),
                }}
              >
                <colgroup>
                  {visibleColumns.map((column) => (
                    <col
                      key={column}
                      style={{ width: getColumnWidth(column) }}
                    />
                  ))}
                  {visibleCustomColumns.map((column) => (
                    <col
                      key={column.id}
                      style={{ width: getColumnWidth(column.id) }}
                    />
                  ))}
                </colgroup>
                <thead>
                  <tr className="border-b border-lr-border bg-lr-surface-muted text-xs uppercase tracking-wide text-lr-subtle">
                    {visibleColumns.map((column) => (
                      <th
                        key={column}
                        className="relative px-4 py-3"
                        style={{ width: getColumnWidth(column) }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{customerJobColumnLabels[column]}</span>
                          <button
                            type="button"
                            aria-label={`Resize ${customerJobColumnLabels[column]} column`}
                            onMouseDown={(event) =>
                              startColumnResize(event, column)
                            }
                            className="h-6 w-1 cursor-col-resize rounded-full bg-lr-border-strong hover:bg-lr-primary"
                          />
                        </div>
                      </th>
                    ))}
                    {visibleCustomColumns.map((column) => (
                      <th
                        key={column.id}
                        className="relative px-4 py-3"
                        style={{ width: getColumnWidth(column.id) }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{column.label}</span>
                          <button
                            type="button"
                            aria-label={`Resize ${column.label} column`}
                            onMouseDown={(event) =>
                              startColumnResize(event, column.id)
                            }
                            className="h-6 w-1 cursor-col-resize rounded-full bg-lr-border-strong hover:bg-lr-primary"
                          />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-lr-border last:border-b-0 hover:bg-lr-hover"
                    >
                      {visibleColumns.map((column) => (
                        <td
                          key={column}
                          className="px-4 py-4 align-top"
                          style={{ width: getColumnWidth(column) }}
                        >
                          {renderCell(column, lead)}
                        </td>
                      ))}
                      {visibleCustomColumns.map((column) => (
                        <td
                          key={column.id}
                          className="px-4 py-4 align-top"
                          style={{ width: getColumnWidth(column.id) }}
                        >
                          {renderCustomCell(column, lead)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
