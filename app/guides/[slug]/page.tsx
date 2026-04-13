import { Suspense } from "react";
import { TitleHeader } from "../../components/ui/title";
import Renderer from "../../components/ui/NotionRendererId";
import "react-notion-x/src/styles.css";
import { RedirectToGuides } from "./goBack";
import { notion, notionClient } from "@/lib/notion";

export const runtime = "edge";

type tParams = Promise<{ slug: string }>;

async function getGuideContent(slug: string) {
  try {
    const recordMap = await notion.getPage(slug);
    const blocksOnly = {
      block: recordMap.block || {},
      signed_urls: recordMap.signed_urls || {},
      collection: {},
      collection_view: {},
      notion_user: {},
      collection_query: {},
    };

    let title = "Guide";
    try {
      const page = await notionClient.pages.retrieve({ page_id: slug });
      if ("properties" in page) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const name = (page.properties as any)?.Name?.title?.[0]?.plain_text;
        if (typeof name === "string" && name.trim()) title = name.trim();
      }
    } catch {
      // Title from Notion API is optional; blocks still render from recordMap.
    }

    return { blocksOnly, title };
  } catch (error) {
    console.error("Error fetching guide content:", error);
    return null;
  }
}

export default async function GuidePage(props: { params: tParams }) {
  const { slug } = await props.params;

  const response = await getGuideContent(slug);

  if (!response) {
    return <div>Error loading content. Please try again later.</div>;
  }

  return (
    <main className="flex flex-col min-h-screen">
      <section className="w-full max-w-screen-xl mx-auto pb-10">
        <div className="pt-4 px-3 md:fixed md:top-20">
          <RedirectToGuides />
        </div>
        <TitleHeader
          text={response.title}
          color="blue"
          textClassName="text-3xl"
          className="mb-8 md:pt-8 "
        />
        <Suspense fallback={<div>Loading...</div>}>
          <Renderer recordMap={response.blocksOnly} />
        </Suspense>
      </section>
    </main>
  );
}
