// This is committee page and should be done by Team Melissa
// Todo: Slicing the design and need to create functionallity to fetch the data from the notion database and render the data on this page

"use client";

import { useEffect, useState } from "react";
import {
  CommCard,
  CommCardDescription,
  CommCardGroup,
  CommCardGroupTitle,
  CommCardHeader,
  CommCardImage,
  CommCardTitle,
} from "../components/ui/committee-card";
import TitleHeader from "../components/ui/title";

export const runtime = "edge";

interface CommitteeMember {
  id: string;
  properties: {
    "committee-group": {
      id: string;
      select: {
        color: string;
        id: string;
        name: string;
      };
      type: string;
    };
    image: {
      id: string;
      rich_text: Array<{
        type: string;
        text: {
          content: string;
          link: string | null;
        };
        annotations: {
          bold: boolean;
          italic: boolean;
          strikethrough: boolean;
          underline: boolean;
          code: boolean;
          color: string;
        };
        href: string | null;
      }>;
      type: string;
    };
    name: {
      id: string;
      title: Array<{
        type: string;
        text: {
          content: string;
          link: string | null;
        };
        annotations: {
          bold: boolean;
          italic: boolean;
          strikethrough: boolean;
          underline: boolean;
          code: boolean;
          color: string;
        };
        href: string | null;
      }>;
      type: string;
    };
    role: {
      id: string;
      type: string;
      rich_text: Array<{
        type: string;
        text: {
          content: string;
          link: string | null;
        };
        annotations: {
          bold: boolean;
          italic: boolean;
          strikethrough: boolean;
          underline: boolean;
          code: boolean;
          color: string;
        };
        href: string | null;
      }>;
    };
  };
}

async function getCommittee(): Promise<CommitteeMember[]> {
  console.log(process.env.NEXT_PUBLIC_URL);
  console.log(process.env.NEXT_PUBLIC_URL + "/api/committee");
  const res = await fetch(process.env.NEXT_PUBLIC_URL + "/api/committee", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch committee data");
  }

  return await res.json();
}

export default function Committee() {
  const [width, setWidth] = useState<number>(0);
  const [columns, setColumns] = useState<2 | 3>(3);
  const [committeeData, setCommitteeData] =
    useState<Record<string, CommitteeMember[]>>();

  useEffect(() => {
    if (typeof window !== undefined) {
      setWidth(window.innerWidth);
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    if (width >= 768) {
      setColumns(3);
    } else {
      setColumns(2);
    }
  }, [width]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCommittee();

        // Notion's data is fetched in reverse, for some reason. This is to reverse it back to how it is shown in the original database.
        const reversedData = [...data].reverse();

        // Group to an array of objects, with the EXCO Dept as the key, and the array of members as the value.
        const groupedData = reversedData.reduce((acc, member) => {
          const groupName = member.properties["committee-group"]?.select?.name;

          if (!acc[groupName]) {
            acc[groupName] = [];
          }

          acc[groupName].push(member);
          return acc;
        }, {} as Record<string, CommitteeMember[]>);

        setCommitteeData(groupedData);
      } catch (error) {
        console.error("Error fetching committee data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start min-h-screen">
      <div className="w-full h-[25vh] md:h-[35vh] lg:h-[50vh]">
        <img
          src="/test_img2.png"
          alt="PINUS Committee Image"
          className="w-full h-full object-cover object-center"
        />
      </div>
      <div className="w-full">
        <TitleHeader text="Our Committee" color="blue" />
      </div>

      <div className="w-full flex flex-col gap-y-16 p-4">
        {committeeData
          ? // Object.entries makes it into an array of arrays so that it is easier to map.
            Object.entries(committeeData).map(([groupName, members]) => (
              <div
                className="flex flex-col justify-center gap-4"
                key={groupName}
                /* @Albert: when you want to scroll here, use <a href={`#${groupName}`}/> for the scroll navigation part. 
                                  The group names are the headers in the page, e.g. Executive Committee, etc. */
                id={groupName}
              >
                <CommCardGroupTitle>{groupName}</CommCardGroupTitle>
                <CommCardGroup columns={columns} gap={5}>
                  {members.map((member) => (
                    <CommCard key={member.id}>
                      <CommCardImage
                        src="/test_img.jpg"
                        alt={member.properties.name.title[0]?.text.content}
                        width={24}
                        height={32}
                      />
                      <CommCardHeader>
                        <CommCardTitle>
                          {member.properties.name.title[0]?.text.content}
                        </CommCardTitle>
                        <CommCardDescription italic>
                          {member.properties.role?.rich_text[0]?.text?.content}
                        </CommCardDescription>
                      </CommCardHeader>
                    </CommCard>
                  ))}
                </CommCardGroup>
              </div>
            ))
          : null}
      </div>
    </main>
  );
}
