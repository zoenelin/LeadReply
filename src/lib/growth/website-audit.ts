import { lookup } from "node:dns/promises"
import net from "node:net"

export type WebsiteAuditFindingInput = {
  category: string
  severity: "HIGH" | "MEDIUM" | "LOW"
  title: string
  description: string
  recommendation: string
}

export type WebsiteAuditResult = {
  targetUrl: string
  score: number
  summary: string
  findings: WebsiteAuditFindingInput[]
}

const blockedHostnames = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
])

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map((part) => Number(part))

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false
  }

  const [first, second] = parts

  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    first === 127 ||
    first === 169 ||
    first === 0
  )
}

function isBlockedAddress(address: string) {
  if (net.isIPv4(address)) {
    return isPrivateIpv4(address)
  }

  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase()

    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80")
    )
  }

  return false
}

export function normalizeAuditUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    throw new Error("Website URL is required before running an audit.")
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
  const url = new URL(withProtocol)

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only public website URLs can be audited.")
  }

  return url
}

export async function assertPublicAuditTarget(url: URL) {
  const hostname = url.hostname.toLowerCase()

  if (
    blockedHostnames.has(hostname) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".test")
  ) {
    throw new Error("Only public business websites can be audited.")
  }

  if (net.isIP(hostname) && isBlockedAddress(hostname)) {
    throw new Error("Private network addresses cannot be audited.")
  }

  const addresses = await lookup(hostname, {
    all: true,
    verbatim: false,
  })

  if (addresses.some((address) => isBlockedAddress(address.address))) {
    throw new Error("This website resolves to a private network address.")
  }
}

function extractTag(html: string, pattern: RegExp) {
  return pattern.exec(html)?.[1]?.replace(/\s+/g, " ").trim() ?? ""
}

function countMatches(html: string, pattern: RegExp) {
  return html.match(pattern)?.length ?? 0
}

function containsAny(value: string, terms: string[]) {
  const normalized = value.toLowerCase()

  return terms.some((term) => normalized.includes(term))
}

function getMetaContent(html: string, name: string) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${escapedName}["'][^>]+content=["']([^"']*)["'][^>]*>`,
    "i"
  )
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escapedName}["'][^>]*>`,
    "i"
  )

  return extractTag(html, pattern) || extractTag(html, reversePattern)
}

function addFinding(
  findings: WebsiteAuditFindingInput[],
  finding: WebsiteAuditFindingInput
) {
  findings.push(finding)
}

export function analyzeWebsiteHtml({
  html,
  targetUrl,
  businessName,
  city,
  state,
  services,
  phone,
}: {
  html: string
  targetUrl: string
  businessName: string
  city: string
  state: string
  services: string
  phone: string
}): WebsiteAuditResult {
  const findings: WebsiteAuditFindingInput[] = []
  const visibleText = html.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const lowerText = visibleText.toLowerCase()
  const title = extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
  const metaDescription = getMetaContent(html, "description")
  const viewport = getMetaContent(html, "viewport")
  const h1Count = countMatches(html, /<h1\b/gi)
  const h2Count = countMatches(html, /<h2\b/gi)
  const hasTelLink = /href=["']tel:/i.test(html)
  const hasForm = /<form\b/i.test(html)
  const hasBookingLanguage = containsAny(lowerText, [
    "book",
    "schedule",
    "reservation",
    "appointment",
    "request a quote",
    "free estimate",
  ])
  const hasReviewLanguage = containsAny(lowerText, [
    "review",
    "testimonial",
    "google",
    "facebook",
  ])
  const hasLocation =
    Boolean(city && lowerText.includes(city.toLowerCase())) ||
    Boolean(state && lowerText.includes(state.toLowerCase()))
  const serviceTerms = services
    .split(/[,;\n]/)
    .map((service) => service.trim().toLowerCase())
    .filter((service) => service.length > 2)
  const serviceHits = serviceTerms.filter((service) =>
    lowerText.includes(service)
  ).length

  if (!title) {
    addFinding(findings, {
      category: "SEO",
      severity: "HIGH",
      title: "Missing page title",
      description: "The homepage does not appear to have a title tag.",
      recommendation:
        "Add a clear title with the business name, main service, and location.",
    })
  } else if (title.length < 20 || title.length > 70) {
    addFinding(findings, {
      category: "SEO",
      severity: "MEDIUM",
      title: "Title tag needs tuning",
      description: `Current title: ${title}`,
      recommendation:
        "Use a concise title around 30-60 characters with service and location language.",
    })
  }

  if (!metaDescription) {
    addFinding(findings, {
      category: "SEO",
      severity: "HIGH",
      title: "Missing meta description",
      description:
        "Search results may not show a strong summary for this business.",
      recommendation:
        "Add a meta description that explains the service, location, and why customers should call.",
    })
  } else if (metaDescription.length < 70 || metaDescription.length > 170) {
    addFinding(findings, {
      category: "SEO",
      severity: "LOW",
      title: "Meta description length could improve",
      description: `Current description length is ${metaDescription.length} characters.`,
      recommendation:
        "Aim for a clear 120-160 character description for local search results.",
    })
  }

  if (h1Count !== 1) {
    addFinding(findings, {
      category: "CONTENT",
      severity: h1Count === 0 ? "HIGH" : "MEDIUM",
      title: h1Count === 0 ? "Missing H1 heading" : "Multiple H1 headings",
      description: `Detected ${h1Count} H1 heading${h1Count === 1 ? "" : "s"}.`,
      recommendation:
        "Use one main H1 that clearly names the service and location.",
    })
  }

  if (h2Count < 2) {
    addFinding(findings, {
      category: "CONTENT",
      severity: "LOW",
      title: "Thin heading structure",
      description:
        "The page may not have enough section headings for customers or search engines.",
      recommendation:
        "Add service, location, reviews, and contact sections with clear H2 headings.",
    })
  }

  if (!viewport) {
    addFinding(findings, {
      category: "MOBILE",
      severity: "MEDIUM",
      title: "Missing mobile viewport tag",
      description:
        "The page may not scale correctly on phones without a viewport meta tag.",
      recommendation:
        "Add a responsive viewport tag and verify the homepage on mobile.",
    })
  }

  if (!hasTelLink && !lowerText.includes(phone.replace(/\D/g, ""))) {
    addFinding(findings, {
      category: "LEAD_CAPTURE",
      severity: "HIGH",
      title: "Phone call path is weak",
      description:
        "The audit did not find an obvious click-to-call link or matching phone number.",
      recommendation:
        "Add a visible click-to-call button near the top of the page.",
    })
  }

  if (!hasForm) {
    addFinding(findings, {
      category: "LEAD_CAPTURE",
      severity: "MEDIUM",
      title: "No lead form detected",
      description:
        "Customers may have no simple way to request a callback or quote after hours.",
      recommendation:
        "Add a short contact, quote, booking, or callback form.",
    })
  }

  if (!hasBookingLanguage) {
    addFinding(findings, {
      category: "CONVERSION",
      severity: "MEDIUM",
      title: "Booking or quote path is unclear",
      description:
        "The page does not clearly mention booking, scheduling, reservations, or quote requests.",
      recommendation:
        "Add a clear next step that matches how this business captures new customers.",
    })
  }

  if (!hasReviewLanguage) {
    addFinding(findings, {
      category: "TRUST",
      severity: "LOW",
      title: "Reviews are not prominent",
      description:
        "The homepage may not show reviews, testimonials, or a trust signal.",
      recommendation:
        "Feature customer reviews and connect the review request workflow.",
    })
  }

  if (!hasLocation) {
    addFinding(findings, {
      category: "LOCAL_SEO",
      severity: "MEDIUM",
      title: "Location signal is weak",
      description:
        "The homepage did not clearly mention the saved city or state.",
      recommendation:
        "Add city, state, and service-area language to the homepage and contact sections.",
    })
  }

  if (serviceTerms.length > 0 && serviceHits === 0) {
    addFinding(findings, {
      category: "LOCAL_SEO",
      severity: "MEDIUM",
      title: "Primary services are hard to find",
      description:
        "The page did not include the primary services recorded in LeadReply.",
      recommendation:
        "Add clear service sections using the same terms customers search for.",
    })
  }

  const highCount = findings.filter((finding) => finding.severity === "HIGH").length
  const mediumCount = findings.filter(
    (finding) => finding.severity === "MEDIUM"
  ).length
  const lowCount = findings.filter((finding) => finding.severity === "LOW").length
  const score = Math.max(0, 100 - highCount * 18 - mediumCount * 10 - lowCount * 4)
  const summary =
    findings.length === 0
      ? `${businessName} has a strong starter website foundation.`
      : `${businessName} scored ${score}/100 with ${findings.length} finding${
          findings.length === 1 ? "" : "s"
        }: ${highCount} high, ${mediumCount} medium, ${lowCount} low.`

  return {
    targetUrl,
    score,
    summary,
    findings,
  }
}

export async function runWebsiteAudit(input: {
  website: string
  businessName: string
  city: string
  state: string
  services: string
  phone: string
}) {
  const url = normalizeAuditUrl(input.website)

  await assertPublicAuditTarget(url)

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "LeadReplyAudit/1.0 (+https://leadreply.local; permission-based client audit)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(12000),
  })

  if (!res.ok) {
    throw new Error(`Website returned ${res.status}.`)
  }

  const contentType = res.headers.get("content-type") ?? ""

  if (!contentType.toLowerCase().includes("html")) {
    throw new Error("The website did not return an HTML page.")
  }

  const html = await res.text()

  return analyzeWebsiteHtml({
    html: html.slice(0, 1_000_000),
    targetUrl: url.toString(),
    businessName: input.businessName,
    city: input.city,
    state: input.state,
    services: input.services,
    phone: input.phone,
  })
}
