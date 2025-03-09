// app/api/events/route.ts
export const runtime = "edge";

import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_EVENTS_ID!;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const subcommParam = url.searchParams.get("subcomm");
    const subcommModifiers = subcommParam ? subcommParam.split(",") : [];

    // Query the Notion database for results
    const { results } = await notion.databases.query({
      database_id: databaseId,
    });

    // Fetch page details for each result in parallel
    const response = await Promise.all(
      results.map(
        (result) =>
          notion.pages.retrieve({
            page_id: result.id,
          }) as Promise<PageObjectResponse>
      )
    );

    // Filter response
    const filtered_response = response.map((result) => {
      const titleProperty = result.properties.Title as {
        type: "title";
        title: { text: { content: string } }[];
      };
      const descriptionProperty = result.properties.Description as {
        type: "rich_text";
        rich_text: { text: { content: string } }[];
      };
      const thumbnailProperty = result.properties.Thumbnail as {
        type: "files";
        files: { file: { url: string } }[];
      };
      const subcomProperty = result.properties.Subcom as {
        type: "select";
        select: { name: string } | null;
      };

      return {
        title: titleProperty.title[0]?.text.content || "No Title",
        description:
          descriptionProperty.rich_text[0]?.text.content || "No Description",
        thumbnail: thumbnailProperty.files[0]?.file.url || "No Image",
        subcom: subcomProperty.select?.name || "No Subcom",
      };
    });

    const itemsFilteredbyModifiers = filtered_response.filter((item) =>
      subcommModifiers.includes(item.subcom)
    );

    if (itemsFilteredbyModifiers.length == 0) {
      return NextResponse.json(filtered_response);
    } else {
      return NextResponse.json(itemsFilteredbyModifiers);
    }
  } catch (error) {
    console.error("Error fetching data from Notion:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Notion." },
      { status: 500 }
    );
  }
}
