import Link from "next/link";
import { HiddenAdminTrigger } from "@/components/hidden-admin-trigger";
import { OracleOrb } from "@/components/cosmic/oracle-orb";
import { Reveal } from "@/components/cosmic/reveal";

const features = [
  {
    title: "Any Question, Any Domain",
    description: "Career moves, relationships, finances, health, creativity — the oracle answers every kind of human question.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
      </svg>
    ),
  },
  {
    title: "Confidence Scores",
    description: "Every prediction carries a clear probability and an honest assessment of how strong the signal really is.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Visible Reasoning",
    description: "No black boxes. Read the logic behind each answer and decide how much weight to give it.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M4.5 3h15m-9 3h3m-3 3h3" />
      </svg>
    ),
  },
  {
    title: "Private by Design",
    description: "Your questions and context are yours. Your personal circumstances shape the reading — and stay protected.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
];

const domains = ["Career & Work", "Relationships", "Finance", "Health", "Education", "Business", "Creativity"];

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 text-center">
      <div className="relative z-10 mt-10 flex flex-col items-center gap-8 py-16 md:py-20">
        <div className="w-44 animate-float sm:w-56 md:w-64 animate-fade-up">
          <OracleOrb />
        </div>

        <div className="flex flex-col items-center gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-cosmic-violet/30 bg-cosmic-violet/10 px-4 py-1.5 text-xs font-medium text-cosmic-violet backdrop-blur animate-fade-up [animation-delay:150ms]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cosmic-violet opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cosmic-violet" />
            </span>
            AI-Powered Foresight Engine
          </span>

          <span className="relative inline-block animate-fade-up [animation-delay:250ms]">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              <span className="text-gradient">A1 Quantum Oracle AI</span>
            </h1>
            <HiddenAdminTrigger className="absolute inset-0" />
          </span>

          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl animate-fade-up [animation-delay:350ms]">
            A universal foresight engine for anyone facing any decision.
            Ask about your career, your relationships, your money, your health — and receive
            AI-powered predictions with confidence scores and visible reasoning.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-up [animation-delay:450ms]">
            <Link
              href="/signup"
              className="cta-shine inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-cosmic-violet to-cosmic-cyan px-8 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(124,58,237,0.45)] transition-transform hover:scale-[1.03]"
            >
              Consult the Oracle
            </Link>
            <Link
              href="/login"
              className="glass inline-flex h-11 items-center justify-center rounded-full px-8 text-sm font-medium shadow-sm transition-colors hover:text-cosmic-cyan"
            >
              Sign In
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground animate-fade-up [animation-delay:550ms]">
            {domains.map((domain) => (
              <span key={domain} className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-cosmic-cyan" aria-hidden="true" />
                {domain}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-20" aria-label="Why A1 Quantum Oracle AI">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 90}>
              <div className="cosmic-card glass h-full p-5 text-left">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cosmic-violet/25 to-cosmic-cyan/25 text-cosmic-cyan">
                  {feature.icon}
                </div>
                <h2 className="mb-1 text-sm font-semibold">{feature.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <footer className="relative z-10 pb-8 text-center text-xs font-semibold text-white/60">
        <p>A creation of Alexander Morenov & S/F Technologies</p>
        <p className="mt-1">29 Bringelly Ave, Pendle Hill, Sydney NSW, Australia</p>
        <p className="mt-1">aonequantumoracleai@gmail.com | +61 420 922 489</p>
      </footer>
    </div>
  );
}
