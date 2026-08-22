import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { CosmicBackground } from "@/components/cosmic/cosmic-background";
import { CookieConsent } from "@/components/privacy/cookie-consent";
import { getSiteTheme, buildThemeCss } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "A1 Quantum Oracle AI — AI Predictions & Forecasting",
    template: "%s | A1 Quantum Oracle AI",
  },
  description:
    "A universal foresight engine for anyone facing any decision. Ask about your career, relationships, money, health — and receive AI-powered predictions with confidence scores and visible reasoning.",
  metadataBase: new URL("https://a1quantumoracleai.com"),
  openGraph: {
    title: "A1 Quantum Oracle AI",
    description:
      "AI-powered predictions with confidence scores. Ask about career, relationships, finance, health, and more.",
    url: "https://a1quantumoracleai.com",
    siteName: "A1 Quantum Oracle AI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "A1 Quantum Oracle AI",
    description:
      "AI-powered predictions with confidence scores. Ask about career, relationships, finance, health, and more.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getSiteTheme();
  const themeCss = buildThemeCss(theme);
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        {themeCss ? <style dangerouslySetInnerHTML={{ __html: themeCss }} /> : null}
        <CosmicBackground />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-background focus:text-foreground">
          Skip to content
        </a>
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  );
}
