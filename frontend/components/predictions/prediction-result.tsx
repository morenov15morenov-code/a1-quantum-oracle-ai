import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatConfidence } from "@/lib/utils";

interface PredictionResultProps {
  prediction: {
    id: string;
    input: string;
    result: string;
    confidence: number | null;
    reasoning: string | null;
    model: string;
    createdAt: Date | string;
  };
}

function getConfidenceColor(confidence: number | null) {
  if (confidence === null) return "bg-muted";
  if (confidence >= 0.8) return "bg-green-500";
  if (confidence >= 0.6) return "bg-yellow-500";
  return "bg-red-500";
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
      </CardContent>
    </Card>
  );
}
