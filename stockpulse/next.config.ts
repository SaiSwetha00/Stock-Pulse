import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

/**
 * Bundle analysis, off unless explicitly asked for.
 *
 * This cannot reach production output, for three independent reasons, and it is
 * worth being precise because "a build tool that ships" is a real failure mode:
 *
 *  1. It is a devDependency, so it is not part of the runtime dependency graph.
 *  2. `enabled` is false unless ANALYZE=true, and nothing sets that except the
 *     `npm run analyze` script. Disabled, `withBundleAnalyzer` returns the
 *     config object untouched.
 *  3. Even enabled, it only *reads* the finished webpack stats and writes HTML
 *     reports to .next/analyze/. It registers no loader and injects no module,
 *     so there is no path by which it adds a byte to a client bundle.
 */
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

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
 * - Permissions-Policy: each entry below is a decision about a device this app
 *   actually uses, and `()` is NOT "default" — it is an EMPTY allowlist, which
 *   denies the feature to every origin including this one. A denied feature
 *   makes getUserMedia reject with NotAllowedError before the browser asks the
 *   user anything, so no amount of granting permission in Android, iOS or the
 *   browser itself will help.
 *
 *     camera=(self)      the barcode scanner on /scan
 *     microphone=(self)  voice input in the AI assistant
 *     geolocation=()     DELIBERATELY denied — nothing reads location, and if
 *                        something ever does, this line should be what stops
 *                        it until somebody decides otherwise
 *
 *   This previously read `camera=(), microphone=(), geolocation=()` under the
 *   note "this app needs none of these devices, so deny them". That was true
 *   when written and silently stopped being true when voice input and the
 *   scanner shipped. It cost several sessions of device-level debugging that
 *   could never have found anything, because the failure was in a response
 *   header rather than on the device. See FOUND-ISSUES.md and DECISIONS.md:
 *   BEFORE calling a browser capability broken, curl this header.
 */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
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

export default withBundleAnalyzer(nextConfig);
