import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL STUB] To: ${to}, Subject: ${subject}`);
    return true;
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Atlas Oracle <noreply@atlas-oracle.com>",
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Reset your Atlas Oracle password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Password Reset Request</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          We received a request to reset your password. Click the button below to set a new password.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #6a6a6a; font-size: 14px;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #9a9a9a; font-size: 12px;">
          Atlas Oracle — AI-Powered Predictions & Forecasting
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Welcome to Atlas Oracle",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Welcome to Atlas Oracle, ${name}!</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          You're now part of a community using AI-powered predictions and forecasting to make better decisions.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Start Predicting
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #9a9a9a; font-size: 12px;">
          Atlas Oracle — AI-Powered Predictions & Forecasting
        </p>
      </div>
    `,
  });
}
