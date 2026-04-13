import { NextResponse } from "next/server";
import { COMMITTEE_MEMBERS } from "@/lib/data/committee";

export async function GET() {
  return NextResponse.json({ results: COMMITTEE_MEMBERS });
}
