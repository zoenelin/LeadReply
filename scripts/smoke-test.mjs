const baseUrl = (
  process.env.APP_BASE_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000"
).replace(/\/$/, "")

const checks = [
  { path: "/", expected: 200 },
  { path: "/login", expected: 200 },
  { path: "/signup", expected: 200 },
  { path: "/robots.txt", expected: 200 },
  { path: "/sitemap.xml", expected: 200 },
  { path: "/widget.js", expected: 200 },
]

for (const check of checks) {
  const url = `${baseUrl}${check.path}`
  const res = await fetch(url, {
    redirect: "manual",
  })

  if (res.status !== check.expected) {
    throw new Error(`${url} returned ${res.status}, expected ${check.expected}`)
  }

  console.log(`ok ${check.path}`)
}

console.log("Smoke checks passed.")
