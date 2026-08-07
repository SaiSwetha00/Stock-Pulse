import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/**
 * Cinzel, the wordmark's family, for page titles inside the app.
 *
 * The shell loaded Inter and nothing else, while the landing and auth shells
 * pulled Cinzel in themselves — which is precisely why the dashboard read as a
 * different product from the page that sells it. Loading it here puts the same
 * voice on both sides of the sign-in.
 *
 * Titles only. Body copy, tables and forms stay in Inter, which is built for
 * exactly that and which Cinzel would make unreadable at 13px.
 */
const cinzel = Cinzel({
  variable: "--font-cinzel-app",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  // metadataBase resolves every relative OG/canonical URL below and in each
  // page's own metadata. Without it Next warns and emits relative OG urls,
  // which most social scrapers refuse to follow.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "StockPulse — Neighborhood Market Operations",
    template: "%s · StockPulse",
  },
  description: "Inventory, sales, and store management for small grocery stores.",
  applicationName: "StockPulse",
  keywords: [
    "grocery store software",
    "small business inventory",
    "point of sale",
    "stock management",
    "independent retailer",
  ],
  openGraph: {
    siteName: "StockPulse",
    type: "website",
    locale: "en_US",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before paint so there is no light/dark flash.
            Deliberately a raw <script> in <head>, NOT next/script with
            strategy="beforeInteractive": that variant left every authenticated
            route rendering an empty <main> on a full page load, because the
            hoisted script ran ahead of React's streaming swap and the Suspense
            boundary never resolved. React logs a dev-only warning about script
            tags in components; a benign warning beats a blank page. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('sp-theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
