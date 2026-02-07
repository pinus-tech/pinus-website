export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { notion, notionClient } from "@/lib/notion";

const trimNotionURL = (url: string) => {
  const splitURL = url.split("-");
  return splitURL[splitURL.length - 1];
};

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
    const blogId = trimNotionURL(pageId);
    const blogProps = await notionClient.pages.retrieve({ page_id: blogId });
    const response = { blogProps: blogProps, recordMap: recordMap };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching data from Notion:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Notion." },
      { status: 500 }
    );
  }
}