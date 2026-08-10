import { db } from "@/lib/db";
import { predictions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { formatDate, formatConfidence } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { Metadata } from "next";

interface SharedPredictionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SharedPredictionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await db
    .select()
    .from(predictions)
    .where(eq(predictions.shareSlug, slug))
    .limit(1);

  const prediction = result[0];
  if (!prediction) {
    return { title: "Prediction Not Found - A1 Quantum Oracle AI" };
  }

  return {
    title: `Shared Prediction - A1 Quantum Oracle AI`,
    description: prediction.input,
  };
}

export default async function SharedPredictionPage({
  params,
}: SharedPredictionPageProps) {
  const { slug } = await params;

  const result = await db
    .select()
    .from(predictions)
    .where(eq(predictions.shareSlug, slug))
    .limit(1);

  const prediction = result[0];

  if (!prediction) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <h1 className="text-xl font-semibold">Prediction not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This shared prediction does not exist or the link has expired.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Go to A1 Quantum Oracle AI
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">A1 Quantum Oracle AI</h1>
          <p className="text-sm text-muted-foreground">Shared Prediction</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">Prediction Result</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatDate(prediction.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {prediction.model}
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      prediction.confidence !== null && prediction.confidence >= 0.8
                        ? "bg-green-500"
                        : prediction.confidence !== null && prediction.confidence >= 0.6
                          ? "bg-yellow-500"
                          : prediction.confidence !== null
                            ? "bg-red-500"
                            : "bg-muted"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {formatConfidence(prediction.confidence)}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                Question
              </h4>
              <p className="text-sm">{prediction.input}</p>
            </div>

            <div>
              <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                Prediction
              </h4>
              <p className="text-sm leading-relaxed">{prediction.result}</p>
            </div>

            {prediction.reasoning && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                  Reasoning
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {prediction.reasoning}
                </p>
              </div>
            )}

            {prediction.domainCategory && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                  Category
                </h4>
                <p className="text-sm">{prediction.domainCategory}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <Link href="/" className="text-primary hover:underline">
              A1 Quantum Oracle AI
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
