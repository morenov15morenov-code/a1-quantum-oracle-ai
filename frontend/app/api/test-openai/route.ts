import { NextResponse } from "next/server";

export async function GET() {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key === "sk-your-openai-api-key") {
      return NextResponse.json({ status: "no_key", keySet: !!key, prefix: key?.substring(0, 8) || "none" });
    }

    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: key });

    const result = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 50,
      messages: [{ role: "user", content: "Say hello in one word." }],
    });

    return NextResponse.json({
      status: "ok",
      model: result.model,
      content: result.choices[0]?.message?.content,
      usage: result.usage,
    });
  } catch (e: any) {
    return NextResponse.json({
      status: "error",
      error: e?.message || String(e),
      code: e?.code,
      type: e?.type,
      status_code: e?.status,
    });
  }
}
