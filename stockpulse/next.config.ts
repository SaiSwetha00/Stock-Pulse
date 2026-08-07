import type { NextConfig } from "next";

/**
 * Vercel already sends HSTS. These are the ones it does not, and they matter
 * for an app that holds an authenticated session:
 *
 * - X-Frame-Options: without it the dashboard can be framed by another origin
 *   and clickjacked into acting as the signed-in user.
 * - X-Content-Type-Options: stops MIME sniffing turning a served file into
 *   executable script.
 * - Referrer-Policy: keeps full URLs (which carry record ids) out of the
 *   Referer header on cross-origin navigations.
 * - Permissions-Policy: this app needs none of these devices, so deny them.
 */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/**
 * Only the project's own Supabase Storage host is allowed through the image
 * optimizer.
 *
 * The optimizer fetches whatever URL it is handed, server-side, so a wildcard
 * pattern would turn this app into an open proxy — anyone could point it at an
 * internal address and read the response back through the image endpoint.
 * Derived from the env var rather than hardcoded so preview and production
 * each allow their own project without a code change.
 *
 * Avatars are free-text URLs, so one on any other host is not optimized; the
 * components fall back to initials rather than render a broken frame.
 */
const supabaseHostname = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    // AVIF first, WebP second, original last — Next negotiates per request
    // against the browser's Accept header, which is what makes a stored PNG
    // or JPEG arrive as WebP without re-encoding anything by hand.
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
