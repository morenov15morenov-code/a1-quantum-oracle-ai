import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin Settings",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Platform configuration and settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Info</CardTitle>
          <CardDescription>General information about the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex justify-between text-sm">
              <dt className="text-muted-foreground">Version</dt>
              <dd>0.1.0</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-muted-foreground">Environment</dt>
              <dd>{process.env.NODE_ENV}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-muted-foreground">AI Model</dt>
              <dd>
                {process.env.OPENAI_API_KEY ? "GPT-4o" : "Mock (no API key set)"}
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-muted-foreground">Database</dt>
              <dd>{process.env.DATABASE_URL?.startsWith("libsql") ? "Turso (LibSQL)" : "SQLite"}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{process.env.RESEND_API_KEY ? "Resend (configured)" : "Console log only"}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-muted-foreground">Error Tracking</dt>
              <dd>{process.env.SENTRY_DSN ? "Sentry (configured)" : "Not configured"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
