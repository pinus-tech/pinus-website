import { NotionAPI } from "notion-client";
import { Client } from "@notionhq/client";

export const notion = new NotionAPI({
    activeUser: process.env.NOTION_ACTIVE_USER,
    authToken: process.env.NOTION_TOKEN_V2,
});

export const notionClient = new Client({
    auth: process.env.NOTION_API_KEY
});
