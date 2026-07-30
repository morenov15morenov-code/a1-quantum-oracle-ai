import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { predictions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const result = await db
    .select()
    .from(predictions)
    .where(and(eq(predictions.id, id), eq(predictions.userId, session.user.id)))
    .limit(1);

  const prediction = result[0];

  if (!prediction) {
    return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
  }

  if (prediction.shareSlug) {
    return NextResponse.json({
      shareSlug: prediction.shareSlug,
      shareUrl: `/shared/${prediction.shareSlug}`,
    });
  }

  const slug = crypto.randomUUID().replace(/-/g, "").substring(0, 8);

  await db
    .update(predictions)
    .set({ shareSlug: slug })
    .where(eq(predictions.id, id));

  return NextResponse.json({
    shareSlug: slug,
    shareUrl: `/shared/${slug}`,
  });
}
