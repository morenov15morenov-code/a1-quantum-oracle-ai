import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { predictions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let allPredictions = await db.select().from(predictions).where(
    eq(predictions.userId, session.user.id)
  );

  if (from) {
    allPredictions = allPredictions.filter(p => p.createdAt >= new Date(from));
  }
  if (to) {
    allPredictions = allPredictions.filter(p => p.createdAt <= new Date(to));
  }

  if (format === "csv") {
    const headers = ["id", "input", "result", "confidence", "reasoning", "model", "domainCategory", "createdAt"];
    const rows = allPredictions.map((p) =>
      headers.map((h) => {
        const val = (p as unknown as Record<string, unknown>)[h];
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="atlas-oracle-predictions-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    total: allPredictions.length,
    predictions: allPredictions.map((p) => ({
      id: p.id,
      input: p.input,
      result: p.result,
      confidence: p.confidence,
      reasoning: p.reasoning,
      model: p.model,
      domainCategory: p.domainCategory,
      createdAt: p.createdAt,
    })),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="atlas-oracle-predictions-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
