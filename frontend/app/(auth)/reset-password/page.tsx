import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
