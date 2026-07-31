import { VerifyEmailForm } from "@/components/forms/verify-email-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email",
};

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
}
