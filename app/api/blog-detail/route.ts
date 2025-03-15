export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { NotionAPI } from "notion-client";
import { Client } from "@notionhq/client";

const notion = new NotionAPI({
  activeUser: process.env.NOTION_ACTIVE_USER,
  authToken: process.env.NOTION_TOKEN_V2,
});

const trimNotionURL = (url: string) => {
  const splitURL = url.split("-");
  return splitURL[splitURL.length - 1];
};

const notionClient = new Client({ auth: process.env.NOTION_API_KEY });

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
    const blogProps = await notionClient.pages.retrieve({ page_id: trimNotionURL(pageId) });
    const response = {blogProps : blogProps, recordMap : recordMap};

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching data from Notion:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Notion." },
      { status: 500 }
    );
  }
}