import { Suspense } from "react";
import { TitleHeader } from "../../components/ui/title";
import Renderer from "../../components/ui/NotionRendererId";
import "react-notion-x/src/styles.css";
import { RedirectToGuides } from "./goBack";

import { notion } from "@/lib/notion";
import { getBlockTitle, parsePageId } from "notion-utils";
import type { ExtendedRecordMap } from "notion-types";

export const runtime = "edge";

type tParams = Promise<{ slug: string }>;

function guideTitle(recordMap: ExtendedRecordMap, slug: string): string {
  const { block: blockMap } = recordMap;
  if (!blockMap || Object.keys(blockMap).length === 0) {
    return "Guide";
  }

  const pageId = parsePageId(slug);
  const idCandidates = [pageId, pageId?.replace(/-/g, ""), slug].filter(
    (id): id is string => Boolean(id)
  );

  for (const id of idCandidates) {
    const value = blockMap[id]?.value;
    if (
      value &&
      (value.type === "page" || value.type === "collection_view_page")
    ) {
      const title = getBlockTitle(value, recordMap);
      if (title) return title;
    }
  }

  for (const wrapper of Object.values(blockMap)) {
    const value = wrapper?.value;
    if (value?.type === "page") {
      const title = getBlockTitle(value, recordMap);
      if (title) return title;
    }
  }

  return "Guide";
}

export default async function GuidePage(props: { params: tParams }) {
  const { slug } = await props.params;

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

      return blocksOnly;
    } catch (error) {
      console.error("Error fetching guide content:", error);
      return null;
    }
  }

  const response = await getGuideContent(slug);

  if (!response) {
    return <div>Error loading content. Please try again later.</div>;
  }

  const recordMap = response as ExtendedRecordMap;

  return (
    <main className="flex flex-col min-h-screen">
      <section className="w-full max-w-screen-xl mx-auto pb-10">
        <div className="pt-4 px-3 md:fixed md:top-20">
          <RedirectToGuides />
        </div>
        <TitleHeader
          text={guideTitle(recordMap, slug)}
          color="blue"
          textClassName="text-3xl"
          className="mb-8 md:pt-8 "
        />
        <Suspense fallback={<div>Loading...</div>}>
          <Renderer recordMap={recordMap} />
        </Suspense>
      </section>
    </main>
  );
}
