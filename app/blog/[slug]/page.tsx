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

  if(!response) {
    return <div>Error loading content. Please try again later.</div>;
  }

  // For now, 1 tag 1 author
  const metablog = {
    title: response.blogProps.properties.Title.title[0].plain_text,
    tags: response.blogProps.properties.Tags.multi_select[0].name,
    author: response.blogProps.properties.Author.people[0].name,
    date: response.blogProps.properties["Published Date"].date.start,
  }
  console.log(response.blogProps);

  return (
    <>
      {/* Blog Header */}
      <div className="flex flex-col gap-2 mb-6 text-gray-600">
        {/* Tags */}
        <span className="text-xl sm:text-2xl font-semibold uppercase tracking-wide drop-shadow-lg text-blue-900">
          {metablog.tags}
        </span>

        {/* Title with stronger Text Shadow */}
        <h1 className="text-3xl sm:text-54l font-bold text-gray-900 [text-shadow:_0_1px_2px_rgba(0,0,0,0.5)]">
          {metablog.title}
        </h1>

        {/* Author & Date with larger font sizes */}
        <span className="text-lg sm:text-xl font-semibold text-gray-900">
          By <span className="font-bold text-gray-700">{metablog.author}</span>
          &nbsp;• {new Date(metablog.date).toLocaleDateString("en-GB", {
            day: "numeric", month: "long", year: "numeric"
          })}
        </span>
      </div>
  
      {/* Blog Content */}
      <article className="max-w-4xl w-full bg-white p-6 sm:p-10 rounded-2xl shadow-lg text-gray-800">
        <Renderer recordMap={response.blocksOnly} />
      </article>
    </>
  );
};


export default function BlogDetail(props: {params: tParams}) {
  return (    
    <main className="relative flex flex-col min-h-screen">
      <div className="absolute top-0 left-0 w-full h-[50vh] sm:h-[60vh] overflow-hidden">
        <div className="absolute inset-0 bg-white/60 z-10" />

        <picture>
          <source media="(max-width: 768px)" srcSet="/hero_mobile.png" />
          <img 
            alt="" 
            src="/hero_desktop.png" 
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        </picture>

        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      <div className="relative flex flex-col flex-grow justify-center items-center z-20 pt-4 sm:pt-6">
        <div className="w-full max-w-3xl p-6 sm:p-8">
          <BlogContent params={props.params} />
        </div>
      </div>

    </main>
  );
}
