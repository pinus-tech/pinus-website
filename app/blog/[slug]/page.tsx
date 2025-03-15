import Button from "@/app/components/ui/button";
import TitleHeader from "@/app/components/ui/title";
import styles from "@/app/styles.module.css";
import Renderer from "@/app/components/ui/NotionRendererId";
import "react-notion-x/src/styles.css";

// This is blog list page and should be done by Team Ella
// Todo: Slicing the design and need to create functionallity to fetch the data from the notion database and render the data on this page. For this one need to read the parameter from the URL and fetch the data based on the parameter. Good Luck!
import Image from "next/image";

export const runtime = "edge";

type tParams = Promise<{ slug: string }>;

async function getBlogPage(slug: string) {
  try {
    const baseUrl = process.env.URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/blog-detail?id=${slug}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch Guide Page");
    }

    const data = await res.json();

    const blocksOnly = {
      block: data.recordMap.block || {},
      signed_urls: data.recordMap.signed_urls || {},
      collection: {},
      collection_view: {},
      notion_user: {},
      collection_query: {},
    };

    return {blocksOnly: blocksOnly, blogProps: data.blogProps};
  } catch (error) {
    console.error("Error fetching guide content:", error);
    return null;
  }
}

async function BlogContent(props: { params: tParams} ) {

  const { slug } = await props.params;
  const response = await getBlogPage(slug);

  console.log(response);

  if(!response) {
    return <div>Error loading content. Please try again later.</div>;
  }

  return (
    <article className="max-w-4xl w-full bg-white p-6 sm:p-10 rounded-2xl shadow-lg text-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 text-gray-500 text-sm">
        <span>📅 February 6, 2025</span>
        <span>⏳ 5 min read</span>
        <span className="text-blue-600 font-semibold">#Community</span>
      </div>
      <h1>{response.blogProps.properties.Title.title[0].plain_text}</h1>
      <Renderer recordMap={response.blocksOnly} />
    </article>
  );
};

const BlogFooter = () => {
  return (
    <div className="w-full max-w-3xl flex justify-between items-center py-6 border-t border-gray-200 mx-auto">
      <div className="flex items-center space-x-4">
        <a href="/previous-post" className="text-lg text-blue-600 hover:underline flex items-center">
          <span className="mr-2">←</span> Pinus Takram Cup
        </a>
      </div>

      <div className="flex items-center space-x-4 justify-end">
        <a href="/next-post" className="text-lg text-blue-600 hover:underline flex items-center">
          PINUS CNY Dinner <span className="ml-2">→</span>
        </a>
      </div>
    </div>
  );
};


export default function BlogDetail(props: {params: tParams}) {
  return (    
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start min-h-screen">
      <div className="relative w-full h-auto">
        <div className={styles.titleImageGradient}></div>
        
        <div className="relative z-0">
          <picture>
            <source media="(max-width: 768px)" srcSet="/hero_mobile.png" />
            <img alt="" src="/hero_desktop.png" className={styles.coverImage} />
          </picture>
        </div>
      </div>

      <div className="w-full flex justify-center mb-4">
        <BlogContent params={props.params} />
      </div>

      <BlogFooter />
    </main>   
  );
}
