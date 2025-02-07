export const runtime = 'edge';

import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_COMMITTEE_ID!;

export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 100, 
    });

    return NextResponse.json(response.results);
  } catch (error) {
    console.error("Error fetching data from Notion:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}