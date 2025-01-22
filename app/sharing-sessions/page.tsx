export const runtime = 'edge';
// This is sharing session list page to show how to fetch data from Notion database and render the data on the page

// Define the type for a single Sharing Session
interface SharingSession {
    id: string;
    properties: {
        Title: {
            title: {
                plain_text: string;
            }[];
        };
    };
}

// Fetch data from the Notion API
async function getSharingSessions(): Promise<SharingSession[]> {
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
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
          {response.map((item) => (
            <div key={item.id}>
              <h1>{item.properties.Title.title[0]?.plain_text || "Untitled"}</h1>
            </div>
          ))}
        </main>
      );
    } catch (error) {
      console.error("Error rendering sharing sessions:", error);
      return <div>Error loading sharing sessions. Please try again later.</div>;
    }
  }