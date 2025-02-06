import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; 

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_BLOGS_ID!;

export async function GET() {
  console.log("GET request initiated"); 
  try {
    const { results } = await notion.databases.query({
      database_id: databaseId,
    });

    console.log("Results fetched:", results);  // Log the fetched results

    const blogs = results.map((result: any) => {
      console.log(result.properties);  // Log properties to inspect them
      const thumbnailUrl = result.properties.Thumbnail?.files?.[0]?.file?.url;
      console.log("Thumbnail URL:", thumbnailUrl);

      return {
        id: result.id,
        title: result.properties.Title?.title?.[0]?.text?.content || "Untitled",
        description: result.properties.Description?.rich_text?.[0]?.text?.content || "",
        date: result.properties['Published Date']?.date?.start || "Unknown",  // Start date of the event
        categories: result.properties.Tags?.multi_select.map((tag: any) => tag.name) || [],
        author: result.properties.Author?.people?.[0]?.name || "Unknown",
        thumbnail: result.properties.Thumbnail?.files?.[0]?.file?.url || "/blue.png",
        
        // Additional fields
        aiDescription: result.properties['AI Description']?.rich_text?.[0]?.text?.content || "No AI Description",  // AI Description field
        publishedDate: result.properties['Published Date']?.date?.start || "Unknown",  // Date field
        otherField: result.properties['Your Custom Field']?.rich_text?.[0]?.text?.content || "N/A",  // Custom field, replace with the actual name
        
        // Handling other types like multi-select, checkbox, etc.
        someBooleanField: result.properties['Some Boolean Field']?.checkbox || false,  // If the property is a checkbox
        someSelectField: result.properties['Some Select Field']?.select?.name || "No Option",  // If the property is a select field
      };
    });

    return NextResponse.json(blogs);
  } catch (error) {
    console.error("Error fetching data from Notion:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs." },
      { status: 500 }
    );
  }
}
