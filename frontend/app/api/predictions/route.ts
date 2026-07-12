import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generatePrediction } from "@/lib/ai";
import { predictionSchema } from "@/lib/validations";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { parsePagination, paginationError } from "@/lib/pagination";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`predict:${session.user.id}:${ip}`, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const body = await request.json();
    const parsed = predictionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { input } = parsed.data;

    const aiResult = await generatePrediction(input);

    const prediction = await prisma.prediction.create({
      data: {
        userId: session.user.id,
        input,
        result: aiResult.result,
        confidence: aiResult.confidence,
        reasoning: aiResult.reasoning,
        model: process.env.OPENAI_API_KEY ? "gpt-4o" : "mock",
        tokensIn: aiResult.tokensIn ?? null,
        tokensOut: aiResult.tokensOut ?? null,
      },
    });

    await prisma.analyticsEvent.create({
      data: {
        event: "prediction_created",
        userId: session.user.id,
        metadata: JSON.stringify({ predictionId: prediction.id }),
      },
    });

    return NextResponse.json(prediction, {
      status: 201,
      headers: getRateLimitHeaders(10, rl.remaining),
    });
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pagination = parsePagination(searchParams);
  if (!pagination) {
    return NextResponse.json(paginationError(), { status: 400 });
  }

  try {
    const { page, limit, skip } = pagination;
    const [predictions, total] = await Promise.all([
      prisma.prediction.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.prediction.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({ predictions, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Predictions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
