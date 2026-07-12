import { RequestResetForm } from "@/components/forms/request-reset-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function RequestResetPage() {
  return <RequestResetForm />;
}
