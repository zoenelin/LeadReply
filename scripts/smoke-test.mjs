const baseUrl = (
  process.env.APP_BASE_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000"
).replace(/\/$/, "")

const checks = [
  { path: "/", expected: [200] },
  { path: "/login", expected: [200] },
  { path: "/signup", expected: [200] },
  { path: "/forgot-password", expected: [200] },
  { path: "/terms", expected: [200] },
  { path: "/privacy", expected: [200] },
  { path: "/robots.txt", expected: [200] },
  { path: "/sitemap.xml", expected: [200] },
  { path: "/widget.js", expected: [200] },
  { path: "/dashboard", expected: [307] },
  { path: "/leads", expected: [307] },
  { path: "/missed-calls", expected: [307] },
  { path: "/reviews", expected: [307] },
  { path: "/marketing", expected: [307] },
  { path: "/seo", expected: [307] },
  { path: "/settings/business", expected: [307] },
  { path: "/settings/security", expected: [307] },
  { path: "/admin", expected: [307] },
]

for (const check of checks) {
  const url = `${baseUrl}${check.path}`
  const res = await fetch(url, {
    redirect: "manual",
  })

  if (!check.expected.includes(res.status)) {
    throw new Error(
      `${url} returned ${res.status}, expected ${check.expected.join(" or ")}`
    )
  }

  console.log(`ok ${check.path} (${res.status})`)
}

console.log("Smoke checks passed.")
