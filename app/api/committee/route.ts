export const runtime = 'edge';

import { Client } from "@notionhq/client";
import { PageObjectResponse, QueryDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";
import { NextResponse } from "next/server";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_COMMITTEE_ID!;

interface NotionCommitteeMember {
  id: string;
  committeeGroup: string;
  name: string;
  role: string;
  photo: string;
}

export async function GET() {
  try {
    let allResults: NotionCommitteeMember[] = [];
    let cursor: string | undefined = undefined;

    do {
      const response: QueryDatabaseResponse = await notion.databases.query({
        database_id: databaseId,
        page_size: 50, // Fetch in batches of 50
        start_cursor: cursor,
      });

      const formattedResults = response.results
        .filter((item) => "properties" in item) 
        .map((item) => {
          const page = item as PageObjectResponse; 
          
          console.log(page)
          return {
            id: page.id,
            committeeGroup: page.properties["committee-group"]?.type === "select"? page.properties["committee-group"]?.select?.name || "" : "",
            name: page.properties.name?.type === "title"? page.properties.name?.title?.[0]?.type === "text"? page.properties.name?.title?.[0]?.text?.content || "" : "" : "",
            role: page.properties.role.type === "rich_text"? page.properties.role?.rich_text?.[0]?.type === "text"? page.properties.role?.rich_text?.[0]?.text?.content || "" : "" : "",
            photo: page.properties.photo.type === "files"? page.properties.photo?.files?.[0]?.type === "external"? page.properties.photo?.files?.[0]?.external?.url || "" : "" : "",
          };
        });

        allResults = [...allResults, ...formattedResults];
        cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    } while (cursor);
    
    return NextResponse.json({ results: allResults });
  } catch (error) {
    console.error("Error fetching data from Notion:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
