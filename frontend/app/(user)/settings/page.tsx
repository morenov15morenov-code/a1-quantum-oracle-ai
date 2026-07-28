"use client";

import { SettingsForm } from "@/components/forms/settings-form";
import { SubscriptionSettings } from "@/components/subscription/subscription-settings";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <SettingsForm />

      <div>
        <h2 className="mb-4 text-xl font-semibold">Subscription</h2>
        <SubscriptionSettings />
      </div>
    </div>
  );
}
