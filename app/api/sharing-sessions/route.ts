'use server'

import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_SHARING_SESSIONS_ID!;

export async function GET() {
  try {
    // Query the Notion database for results
    const { results } = await notion.databases.query({
      database_id: databaseId,
    });

    // Fetch page details for each result in parallel
    const response = await Promise.all(
      results.map((result) =>
        notion.pages.retrieve({ page_id: result.id })
      )
    );

    // Return the fetched response as JSON
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching data from Notion:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Notion." },
      { status: 500 }
    );
  }
}