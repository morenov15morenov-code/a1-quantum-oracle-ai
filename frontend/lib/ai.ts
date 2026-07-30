export interface PredictionResult {
  result: string;
  confidence: number;
  reasoning: string;
  tokensIn?: number;
  tokensOut?: number;
}

function generateMockPrediction(input: string): PredictionResult {
  const mockResults = [
    {
      result: "Based on current trends and available data, the outlook is moderately positive. There is a 72% probability of favorable outcomes within the next quarter, assuming no major external disruptions occur.",
      confidence: 0.72,
      reasoning: "Historical patterns show similar conditions have led to positive outcomes 7 out of 10 times. Key indicators are aligned favorably, though some uncertainty remains due to external market factors.",
    },
    {
      result: "The analysis suggests a cautious approach is warranted. The probability of success stands at approximately 58%, with several risk factors that need to be monitored closely.",
      confidence: 0.58,
      reasoning: "While baseline metrics appear stable, there are emerging signals that could impact the trajectory. Three out of five leading indicators are positive, but two show signs of volatility.",
    },
    {
      result: "The forecast indicates strong potential with an 89% confidence level. All major factors are aligned for a highly favorable outcome.",
      confidence: 0.89,
      reasoning: "Comprehensive analysis of 12 key metrics shows consistent positive trends across all categories. Historical data from comparable scenarios strongly supports this projection.",
    },
    {
      result: "Current data points to a neutral outlook with slight positive bias. Expected outcome probability is 65%, with outcomes likely to materialize within the forecast window.",
      confidence: 0.65,
      reasoning: "The data presents a mixed picture. While short-term indicators are promising, longer-term projections carry more uncertainty. Monitoring and reassessment in 30 days is recommended.",
    },
    {
      result: "The prediction model shows elevated uncertainty. Confidence is at 45%, suggesting this scenario has more variables than typical forecasts. Close monitoring and additional data collection are advised.",
      confidence: 0.45,
      reasoning: "Unusual patterns detected in the input data increase prediction variance. The model identified 4 atypical factors that deviate from standard forecasting conditions, reducing confidence.",
    },
  ];

  const index = Math.abs(input.length) % mockResults.length;
  return mockResults[index];
}

export async function generatePrediction(input: string, systemPrompt?: string): Promise<PredictionResult> {
  const useMock = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-your-openai-api-key";

  if (useMock) {
    await new Promise((r) => setTimeout(r, 1200));
    return generateMockPrediction(input);
  }

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt || "You are an AI prediction and forecasting assistant. For each query, provide:\n1. A clear prediction/forecast\n2. A confidence score (0-1)\n3. Your reasoning\nRespond in JSON format: { \"result\": \"...\", \"confidence\": 0.XX, \"reasoning\": \"...\" }",
        },
        { role: "user", content: input },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    const parsed = JSON.parse(content) as PredictionResult;
    return {
      result: parsed.result || "No prediction generated.",
      confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)),
      reasoning: parsed.reasoning || "No reasoning provided.",
      tokensIn: completion.usage?.prompt_tokens,
      tokensOut: completion.usage?.completion_tokens,
    };
  } catch (error) {
    console.error("AI prediction error:", error);
    return generateMockPrediction(input);
  }
}
