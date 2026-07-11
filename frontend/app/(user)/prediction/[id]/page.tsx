import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PredictionResultCard } from "@/components/predictions/prediction-result";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prediction Details",
};

export default async function PredictionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return <p className="text-center text-muted-foreground">Unauthorized</p>;
  }

  const prediction = await prisma.prediction.findUnique({ where: { id } });

  if (!prediction || prediction.userId !== session.user.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      <PredictionResultCard prediction={prediction} />
    </div>
  );
}
