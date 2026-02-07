export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { notion } from "@/lib/notion";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("id");

    if (!pageId) {
      return NextResponse.json(
        { error: "Missing 'id' parameter in the query string." },
        { status: 400 }
      );
    }

    const recordMap = await notion.getPage(pageId);

    return NextResponse.json(recordMap);
  } catch (error) {
    console.error("Error fetching data from Notion:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Notion." },
      { status: 500 }
    );
  }
}
