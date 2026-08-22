import { NextResponse } from "next/server";
import { getSiteTheme } from "@/lib/theme";

export async function GET() {
  const theme = await getSiteTheme();
  return NextResponse.json({ theme });
}
