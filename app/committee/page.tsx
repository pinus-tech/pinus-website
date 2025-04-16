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
import Link from "next/link";
import Button from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

export const runtime = "edge";

interface CommitteeMember {
  id: string;
  committeeGroup: string;
  name: string;
  role: string;
  photo: string;
}

async function getCommittee(): Promise<{ results: CommitteeMember[] }> {
  const res = await fetch("/api/committee", {
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

        console.log(data);
        // Notion's data is fetched in reverse, for some reason. This is to reverse it back to how it is shown in the original database.
        const reversedData = [...data.results].reverse();

        // Group to an array of objects, with the EXCO Dept as the key, and the array of members as the value.
        const groupedData = reversedData.reduce((acc, member) => {
          const groupName = member.committeeGroup; // Get the committee group name.

          if (!acc[groupName]) {
            acc[groupName] = [];
          }

          acc[groupName].push(member);
          return acc;
        }, {} as Record<string, CommitteeMember[]>);

        // Update the state with the grouped data.
        setCommitteeData(groupedData);
      } catch (error) {
        console.error("Error fetching committee data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start min-h-screen pb-16">
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
      <div className="flex w-full justify-center p-4 whitespace-nowrap">
        <div className="flex flex-row overflow-x-auto gap-5 no-scrollbar">
          {committeeData
            ? Object.entries(committeeData).map(([groupName]) => (
                <Link key={groupName + "Button"} href={"#" + groupName}>
                  <Button className="border-2 hover:bg-white hover:text-blue-main hover:border-blue-main">
                    {groupName}
                  </Button>
                </Link>
              ))
            : null}
        </div>
      </div>

      <div className="w-full flex flex-col gap-y-16 p-4">
        {!isLoading && committeeData ? (
          // Object.entries makes it into an array of arrays so that it is easier to map.
          Object.entries(committeeData).map(([groupName, members]) => (
            <div
              className="flex flex-col justify-center scroll-m-20 gap-4"
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
                      src={member.photo ? member.photo : "/test_img.jpg"}
                      alt={member.name}
                      width={24}
                      height={32}
                    />
                    <CommCardHeader>
                      <CommCardTitle>{member.name}</CommCardTitle>
                      <CommCardDescription italic>
                        {member.role}
                      </CommCardDescription>
                    </CommCardHeader>
                  </CommCard>
                ))}
              </CommCardGroup>
            </div>
          ))
        ) : (
          <div className="flex flex-col justify-center w-full items-center gap-4">
            <Skeleton skeletonColor="blue" className="w-52 h-6" />
            <CommCardGroup columns={columns} gap={5}>
              <Skeleton
                skeletonColor="blue"
                className="w-32 sm:w-56 md:w-64 h-56"
              />
              <Skeleton
                skeletonColor="blue"
                className="w-32 sm:w-56 md:w-64 h-56"
              />
              <Skeleton
                skeletonColor="blue"
                className="w-32 sm:w-56 md:w-64 h-56"
              />
              <Skeleton
                skeletonColor="blue"
                className="w-32 sm:w-56 md:w-64 h-56"
              />
              <Skeleton
                skeletonColor="blue"
                className="w-32 sm:w-56 md:w-64 h-56"
              />
            </CommCardGroup>
          </div>
        )}
      </div>
    </main>
  );
}
