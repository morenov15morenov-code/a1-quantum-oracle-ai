import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteTheme } from "@/lib/schema";
import { HEX_PATTERN, THEME_FONTS, THEME_RADII } from "@/lib/theme";

const themeSchema = z.object({
  background: z.string().regex(HEX_PATTERN).nullish(),
  foreground: z.string().regex(HEX_PATTERN).nullish(),
  cardBackground: z.string().regex(HEX_PATTERN).nullish(),
  border: z.string().regex(HEX_PATTERN).nullish(),
  primary: z.string().regex(HEX_PATTERN).nullish(),
  accent: z.string().regex(HEX_PATTERN).nullish(),
  radius: z.enum(THEME_RADII).nullish(),
  fontFamily: z.string().refine((v) => v in THEME_FONTS).nullish(),
});

export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = themeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid theme values" }, { status: 400 });
  }

  const values = parsed.data;

  await db
    .insert(siteTheme)
    .values({ id: 1, ...values, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteTheme.id,
      set: { ...values, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
