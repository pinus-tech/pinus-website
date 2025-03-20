// app/api/contact-us/route.ts
export const runtime = 'edge';

import { Client } from "@notionhq/client";
import { NextRequest, NextResponse } from "next/server";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_CONTACT_US_ID!;

export async function POST(req: NextRequest) {
    try {
        const { name, email, message } = await req.json(); 

        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                Name: {
                    title: [{ text: { content: name } }],
                },
                Email: {
                    email: email,
                },
                Message: {
                    rich_text: [{ text: { content: message } }], 
                },
            },
        });

        return NextResponse.json({ message: 'Success! Entry added to Notion.', data: response }, { status: 200 });
    } catch (error) {
        console.error("Error fetching data from Notion:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}

