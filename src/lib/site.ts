export const siteName = "LeadReply"

export const siteDescription =
  "LeadReply helps local businesses capture missed calls, follow up with leads, track revenue, and request reviews from one simple CRM."

export function getSiteUrl() {
  const siteUrl =
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000"

  return siteUrl.replace(/\/$/, "")
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  return `${getSiteUrl()}${normalizedPath}`
}

export function pageTitle(title: string) {
  return `${title} | ${siteName}`
}

export const noIndexRobots = {
  index: false,
  follow: false,
}
