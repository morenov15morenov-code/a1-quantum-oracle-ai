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
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Version</span>
            <span>0.1.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Environment</span>
            <span>{process.env.NODE_ENV}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">AI Model</span>
            <span>
              {process.env.OPENAI_API_KEY ? "GPT-4o" : "Mock (no API key set)"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Database</span>
            <span>SQLite</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
