export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <div>
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: July 31, 2026</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p>
          We collect information you provide when creating an account and using our service:
          your name, email address, prediction queries, feedback, and account preferences.
        </p>
        <p>
          When using OAuth providers (Google, GitHub), we receive the name and email
          associated with your provider account.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
        <p>Your information is used to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Provide and improve prediction services</li>
          <li>Personalize your experience and predictions</li>
          <li>Send password reset emails and service notifications</li>
          <li>Analyze usage patterns to improve the platform</li>
          <li>Detect and prevent abuse or unauthorized access</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. Data Storage and Security</h2>
        <p>
          Your data is encrypted in transit using TLS. Passwords are hashed using bcrypt
          with 12 salt rounds. We implement rate limiting, account lockout, and session
          management to protect your account.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">4. Your Rights</h2>
        <p>You have the right to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Access your personal data via the settings page</li>
          <li>Export your prediction history in JSON or CSV format</li>
          <li>Delete your account and all associated data</li>
          <li>Update your profile information at any time</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">5. Cookies</h2>
        <p>
          We use essential session cookies for authentication. These are required for
          the service to function. We do not use tracking cookies or third-party
          advertising cookies.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">6. Third-Party Services</h2>
        <p>
          We use the following third-party services that may process your data:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Resend — transactional email delivery (password resets, notifications)</li>
          <li>Sentry — error tracking and performance monitoring</li>
          <li>OpenAI — AI prediction generation (when enabled)</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">7. Contact</h2>
        <p>
          For privacy-related inquiries or to exercise your data rights,
          contact us at privacy@a1quantumoracleai.com.
        </p>
      </section>
    </div>
  );
}
