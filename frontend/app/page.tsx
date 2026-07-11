import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight">
          Atlas Oracle
        </h1>
        <p className="text-xl text-muted-foreground">
          AI-powered prediction and forecasting tool. Make informed decisions with data-driven insights.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
