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

function getGaugeColor(confidence: number | null) {
  if (confidence === null) return "text-muted";
  if (confidence >= 0.8) return "text-emerald-400";
  if (confidence >= 0.6) return "text-amber-400";
  if (confidence >= 0.4) return "text-orange-400";
  return "text-rose-400";
}

function ConfidenceGauge({ confidence }: { confidence: number | null }) {
  const pct = confidence === null ? 0 : Math.min(1, Math.max(0, confidence));
  const R = 20;
  const C = 2 * Math.PI * R;
  const color = getGaugeColor(confidence);
  return (
    <div className="relative h-16 w-16 shrink-0" role="img" aria-label={`Confidence ${formatConfidence(confidence)}`}>
      <div className={`absolute inset-0 rounded-full opacity-40 blur-lg ${color}`} aria-hidden="true" />
      <svg viewBox="0 0 52 52" className={`relative h-16 w-16 -rotate-90 ${color}`} aria-hidden="true">
        <circle cx="26" cy="26" r={R} fill="none" strokeWidth="5" className="stroke-muted/60" />
        <circle
          cx="26"
          cy="26"
          r={R}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          className="stroke-current transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
        {formatConfidence(confidence)}
      </div>
    </div>
  );
}

export function PredictionResultCard({ prediction }: PredictionResultProps) {
  return (
    <Card className="cosmic-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">Prediction Result</CardTitle>
            <p className="text-sm text-muted-foreground">{formatDate(prediction.createdAt)}</p>
            <span className="inline-flex items-center rounded-full border border-cosmic-violet/30 bg-cosmic-violet/10 px-2 py-0.5 text-xs text-cosmic-violet">
              {prediction.model}
            </span>
          </div>
          <ConfidenceGauge confidence={prediction.confidence} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-cosmic-cyan/20 bg-cosmic-cyan/5 px-4 py-3">
          <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Your Question</h4>
          <p className="text-sm italic text-foreground/90">{prediction.input}</p>
        </div>

        <div>
          <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Prediction</h4>
          <p className="text-base leading-relaxed">{prediction.result}</p>
        </div>

        {prediction.reasoning && (
          <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Reasoning</h4>
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
