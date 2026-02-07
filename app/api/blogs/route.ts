export const runtime = "edge";

import { NextResponse } from "next/server";
import { notionClient as notion } from "@/lib/notion";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const databaseId = process.env.NOTION_DATABASE_BLOGS_ID!;

interface NotionProperties {
  Title: { title: { text: { content: string } }[] };
  Description: { rich_text: { text: { content: string } }[] };
  "Published Date": { date?: { start: string } };
  Tags: { multi_select: { name: string }[] };
  Author: { people: { name: string }[] };
  Thumbnail: { files?: { file?: { url: string } }[] };
  "AI Description"?: { rich_text: { text: { content: string } }[] };
  "Your Custom Field"?: { rich_text: { text: { content: string } }[] };
  "Some Boolean Field"?: { checkbox: boolean };
  "Some Select Field"?: { select?: { name: string } };
}

function hasProperties(result: PageObjectResponse): result is PageObjectResponse & { properties: NotionProperties } {
  const properties = result.properties as unknown as NotionProperties;
  return properties.Title !== undefined && properties.Description !== undefined;
}

export async function GET() {
  //console.log("GET request initiated"); 
  try {
    const { results } = await notion.databases.query({
      database_id: databaseId,
    });

    //console.log("Results fetched:", results);

    const blogs = results.map((result) => {
      if ('url' in result) {
        if ('properties' in result && hasProperties(result as PageObjectResponse)) {
          console.log(result);
          const properties = (result as PageObjectResponse).properties as unknown as NotionProperties;

          return {
            id: result.id,
            url: result.url,
            title: properties.Title?.title?.[0]?.text?.content || "Untitled",
            description: properties.Description?.rich_text?.[0]?.text?.content || "",
            date: properties['Published Date']?.date?.start || "Unknown",
            categories: properties.Tags?.multi_select.map((tag) => tag.name) || [],
            author: properties.Author?.people?.[0]?.name || "Unknown",
            thumbnail: properties.Thumbnail?.files?.[0]?.file?.url || "/blue.png",
            aiDescription: properties['AI Description']?.rich_text?.[0]?.text?.content || "No AI Description",
            publishedDate: properties['Published Date']?.date?.start || "Unknown",
            otherField: properties['Your Custom Field']?.rich_text?.[0]?.text?.content || "N/A",
            someBooleanField: properties['Some Boolean Field']?.checkbox || false,
            someSelectField: properties['Some Select Field']?.select?.name || "No Option",
          };
        }
      } else {
        console.error("Result does not have properties field", result);
        return null;
      }
    }).filter(blog => blog !== null);
    console.log("Blogs fetched:", blogs);
    return NextResponse.json(blogs);
  } catch (error) {
    console.error("Error fetching data from Notion:", error);
    return NextResponse.json({ error: "Failed to fetch data from Notion." }, { status: 500 });
  }
}