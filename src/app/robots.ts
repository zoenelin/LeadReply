import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/config/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/analytics",
          "/dashboard",
          "/intake/",
          "/leads",
          "/login",
          "/missed-calls",
          "/notifications",
          "/owner",
          "/snapshot",
          "/reviews",
          "/settings",
          "/signup",
          "/widget/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
