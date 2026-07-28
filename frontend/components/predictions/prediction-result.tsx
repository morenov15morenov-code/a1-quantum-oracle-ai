import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatConfidence } from "@/lib/utils";
import type { PredictionFeedbackData } from "@/types";

interface PredictionResultProps {
  prediction: {
    id: string;
    input: string;
    result: string;
    confidence: number | null;
    reasoning: string | null;
    model: string;
    createdAt: Date | string;
    feedback?: PredictionFeedbackData | null;
  };
  showFeedback?: boolean;
}

function getConfidenceColor(confidence: number | null) {
  if (confidence === null) return "bg-muted";
  if (confidence >= 0.8) return "bg-green-500";
  if (confidence >= 0.6) return "bg-yellow-500";
  return "bg-red-500";
}

function getRatingStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <svg
      key={i}
      className={`h-3.5 w-3.5 ${i < rating ? "text-yellow-400" : "text-muted"}`}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ));
}

export function PredictionResultCard({ prediction }: PredictionResultProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Prediction Result</CardTitle>
            <p className="text-sm text-muted-foreground">{formatDate(prediction.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{prediction.model}</span>
            <div className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${getConfidenceColor(prediction.confidence)}`} />
              <span className="text-sm font-medium">{formatConfidence(prediction.confidence)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-1 text-sm font-medium text-muted-foreground">Your Question</h4>
          <p className="text-sm">{prediction.input}</p>
        </div>

        <div>
          <h4 className="mb-1 text-sm font-medium text-muted-foreground">Prediction</h4>
          <p className="text-sm leading-relaxed">{prediction.result}</p>
        </div>

        {prediction.reasoning && (
          <div>
            <h4 className="mb-1 text-sm font-medium text-muted-foreground">Reasoning</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">{prediction.reasoning}</p>
          </div>
        )}

        {prediction.feedback && (
          <div className="rounded-md bg-muted/50 p-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Your Rating:</span>
              <div className="flex" aria-label={`Rating: ${prediction.feedback.rating} out of 5`}>
                {getRatingStars(prediction.feedback.rating)}
              </div>
            </div>
            {prediction.feedback.wasAccurate !== null && (
              <p className="text-xs text-muted-foreground">
                Marked as: {prediction.feedback.wasAccurate ? "Accurate" : "Not accurate"}
              </p>
            )}
            {prediction.feedback.domain && (
              <p className="text-xs text-muted-foreground">Domain: {prediction.feedback.domain}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
