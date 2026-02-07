export const runtime = 'edge';

import { NextResponse } from "next/server";
import { notion } from "@/lib/notion";

const pblPageID = process.env.NOTION_PAGE_PBL_ID!;

export async function GET() {
  try {
    const recordMap = await notion.getPage(pblPageID)

    return NextResponse.json(recordMap);
  } catch (error) {
    console.error("Error fetching data from Notion:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Notion." },
      { status: 500 }
    );
  }
}