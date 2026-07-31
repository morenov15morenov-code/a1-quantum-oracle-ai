"use client";

import { SettingsForm } from "@/components/forms/settings-form";
import { SubscriptionSettings } from "@/components/subscription/subscription-settings";
import { DeleteAccountForm } from "@/components/forms/delete-account-form";
import { VerificationBanner } from "@/components/auth/verification-banner";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <VerificationBanner />

      <SettingsForm />

      <div>
        <h2 className="mb-4 text-xl font-semibold">Subscription</h2>
        <SubscriptionSettings />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Danger Zone</h2>
        <DeleteAccountForm />
      </div>
    </div>
  );
}
