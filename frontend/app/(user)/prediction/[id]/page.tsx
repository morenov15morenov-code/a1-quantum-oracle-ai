import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { predictions, predictionFeedbacks } from "@/lib/schema";
import { notFound } from "next/navigation";
import { PredictionResultCard } from "@/components/predictions/prediction-result";
import { PredictionFeedback } from "@/components/predictions/prediction-feedback";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";

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

  const row = await db.select({
    id: predictions.id,
    userId: predictions.userId,
    input: predictions.input,
    result: predictions.result,
    confidence: predictions.confidence,
    reasoning: predictions.reasoning,
    model: predictions.model,
    tokensIn: predictions.tokensIn,
    tokensOut: predictions.tokensOut,
    createdAt: predictions.createdAt,
    feedbackId: predictionFeedbacks.id,
    feedbackRating: predictionFeedbacks.rating,
    feedbackWasAccurate: predictionFeedbacks.wasAccurate,
    feedbackComment: predictionFeedbacks.comment,
    feedbackDomain: predictionFeedbacks.domain,
  })
    .from(predictions)
    .leftJoin(predictionFeedbacks, eq(predictions.id, predictionFeedbacks.predictionId))
    .where(eq(predictions.id, id))
    .get();

  if (!row || row.userId !== session.user.id) {
    notFound();
  }

  const prediction = {
    ...row,
    feedback: row.feedbackId ? {
      id: row.feedbackId,
      rating: row.feedbackRating!,
      wasAccurate: row.feedbackWasAccurate,
      comment: row.feedbackComment,
      domain: row.feedbackDomain,
    } : null,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <PredictionResultCard prediction={prediction} />
      {!prediction.feedback && (
        <PredictionFeedback predictionId={prediction.id} />
      )}
    </div>
  );
}
