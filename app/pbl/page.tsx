export const runtime = 'edge';
// This is a pinus buddy leaderboard page to show how to fetch data from Notion page and render the notion page as a react page

import { TitleHeader } from "../components/ui/title";
import Renderer from "../components/ui/NotionRenderer";
// core styles shared by all of react-notion-x (required)
import 'react-notion-x/src/styles.css'


// Fetch data from the Notion API
async function getPBLContent(){
    console.log(process.env.URL);
    const res = await fetch(process.env.URL + "/api/pbl", {
      cache: "no-store",
    });
  
    if (!res.ok) {
      throw new Error("Failed to fetch PBL Page");
    }
  
    // Parse and return the JSON response
    const pblContent = await res.json();
    return pblContent;
}

// Render the list of Sharing Sessions
export default async function PBLPage() {
    try {
      const response = await getPBLContent();
  
      return (
        <main className="flex flex-col min-h-screen">
            <section className="w-full max-w-screen-xl mx-auto py-10">
                <TitleHeader text="PINUS Buddy Leaderboard" color="blue" textClassName="text-3xl"  />
                <Renderer recordMap={response} />                   
            </section>          
        </main>
      );
    } catch (error) {
      console.error("Error rendering PBL Page:", error);
      return <div>Error loading PBL Page. Please try again later.</div>;
    }
}