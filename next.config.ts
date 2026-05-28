import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const baseSecurityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const appContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  `connect-src 'self'${isProduction ? "" : " ws: wss: http://localhost:*"}`,
  "frame-src 'self' https://checkout.stripe.com https://js.stripe.com",
  "frame-ancestors 'self'",
].join("; ");

const widgetContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  `connect-src 'self'${isProduction ? "" : " ws: wss: http://localhost:*"}`,
  "frame-ancestors *",
].join("; ");

const appPageFrameHeaders = [
  {
    key: "Content-Security-Policy",
    value: appContentSecurityPolicy,
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.30.151.218"],
  poweredByHeader: false,
  reactCompiler: true,
  async headers() {
    const framedAppRoutes = [
      "/",
      "/login",
      "/signup",
      "/dashboard/:path*",
      "/owner/:path*",
      "/notifications/:path*",
      "/leads/:path*",
      "/missed-calls/:path*",
      "/analytics/:path*",
      "/reviews/:path*",
      "/settings/:path*",
      "/intake/:path*",
    ];

    return [
      {
        source: "/:path*",
        headers: baseSecurityHeaders,
      },
      ...framedAppRoutes.map((source) => ({
        source,
        headers: appPageFrameHeaders,
      })),
      {
        source: "/widget/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: widgetContentSecurityPolicy,
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
