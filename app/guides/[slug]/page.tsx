import { Suspense } from "react";
import { TitleHeader } from "../../components/ui/title";
import Renderer from "../../components/ui/NotionRendererId";
import "react-notion-x/src/styles.css";
import { RedirectToGuides } from "./goBack";

export const runtime = "edge";

type tParams = Promise<{ slug: string }>;

export default async function GuidePage(props: { params: tParams }) {
  const { slug } = await props.params;

  async function getGuideContent(slug: string) {
    try {
      const baseUrl = process.env.URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/guides-page?id=${slug}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch Guide Page");
      }

      const data = await res.json();

      const blocksOnly = {
        block: data.block || {},
        signed_urls: data.signed_urls || {},
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

  return (
    <main className="flex flex-col min-h-screen">
      <section className="w-full max-w-screen-xl mx-auto pb-10">
        <div className="pt-4 px-3 md:fixed md:top-20">
          <RedirectToGuides />
        </div>
        <TitleHeader
          text={
            response.block[Object.keys(response.block)[0]].value.properties
              .title[0]
          }
          color="blue"
          textClassName="text-3xl"
          className="mb-8 md:pt-8 "
        />
        <Suspense fallback={<div>Loading...</div>}>
          <Renderer recordMap={response} />
        </Suspense>
      </section>
    </main>
  );
}
