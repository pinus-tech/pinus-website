export const runtime = "edge";

import { NextResponse } from "next/server";
import { notionClient as notion } from "@/lib/notion";

const databaseId = process.env.NOTION_DATABASE_BLOGS_ID!;

export async function GET() {
  try {
    // Retrieve the database schema
    const database = await notion.databases.retrieve({ database_id: databaseId });

    // Access the Tags property (adjust name if yours differs)
    const tagProperty = database.properties["Tags"]; // case-sensitive!

    if (tagProperty?.type !== "multi_select") {
      return NextResponse.json([], { status: 200 });
    }

    const tagOptions = tagProperty.multi_select.options.map(option => option.name);

    return NextResponse.json(tagOptions.sort());
  } catch (error) {
    console.error("Error fetching tag options:", error);
    return NextResponse.json({ error: "Failed to fetch tag options" }, { status: 500 });
  }
}
