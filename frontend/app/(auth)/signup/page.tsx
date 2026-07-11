import { SignupForm } from "@/components/forms/signup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return <SignupForm />;
}
