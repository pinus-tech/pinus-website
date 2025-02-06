export const runtime = 'edge';
// This is sharing session list page to show how to fetch data from Notion database and render the data on the page
// Define the type for a single Sharing Session

import { TitleHeader } from "../components/ui/title";
import Link from 'next/link';
import Image from 'next/image';

interface SharingSession {
    id: string;
    properties: {
        Title: {
            title: {
                plain_text: string;
            }[];
        };
        "Link Youtube": {
            url: string;
        };
        "Thumbnail Image": {
            files: {
                file: {
                    url: string;
                };
            }[];
        };
    };
}

// Fetch data from the Notion API
async function getSharingSessions(): Promise<SharingSession[]> {
    console.log(process.env.URL);
    const res = await fetch(process.env.URL + "/api/sharing-sessions", {
      cache: "no-store",
    });
  
    if (!res.ok) {
      throw new Error("Failed to fetch sharing sessions");
    }
  
    // Parse and return the JSON response
    const sharingSessions: SharingSession[] = await res.json();
    return sharingSessions;
}

// Render the list of Sharing Sessions
export default async function SharingSessionList() {
    try {
      const response = await getSharingSessions();
      console.log(response);
  
      return (
        <main className="flex flex-col min-h-screen">
            <section className="w-full max-w-screen-xl mx-auto py-10">
                <TitleHeader text="Sharing Sessions" color="blue" textClassName="text-3xl"  />
                <div className="grid md:grid-cols-3 gap-7 p-4 md:max-w-full md:mx-auto grid-cols-1 max-w-sm mx-auto mt-8">
                    {response.map((item) => (
                        <Link href={item.properties["Link Youtube"].url} key={item.id} className="group overflow-hidden">
                            <div className="relative aspect-video w-full">
                                <Image
                                    src={item.properties["Thumbnail Image"].files[0].file.url}
                                    alt={item.properties.Title.title[0]?.plain_text}
                                    fill={true}
                                    sizes="50vw"
                                    priority
                                    className='object-cover object-center duration-300 group-hover:scale-110'
                                />
                                <div className="absolute bg-blue-main opacity-90 w-full h-full top-0 left-0 duration-500 translate-y-full group-hover:translate-y-0">
                                    <div className="absolute w-full h-full flex flex-col items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#fff" stroke="var(--red-main)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>                      
            </section>          
        </main>
      );
    } catch (error) {
      console.error("Error rendering sharing sessions:", error);
      return <div>Error loading sharing sessions. Please try again later.</div>;
    }
}