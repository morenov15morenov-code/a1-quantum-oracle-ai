import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { CosmicBackground } from "@/components/cosmic/cosmic-background";
import { CookieConsent } from "@/components/privacy/cookie-consent";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "A1 Quantum Oracle AI — AI Predictions & Forecasting",
    template: "%s | A1 Quantum Oracle AI",
  },
  description: "AI-powered prediction and forecasting tool. Make informed decisions with data-driven insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
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
