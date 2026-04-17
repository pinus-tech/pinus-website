"use client";

import { useEffect, useMemo, useState } from "react";
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
import { COMMITTEE_GROUP_PHOTOS, COMMITTEE_MEMBERS } from "@/lib/data/committee";

const GROUP_ORDER = [
  "Executive Committee",
  "Technology",
  "Ambassadors",
  "Creative Marketing",
  "PPD",
  "Press",
  "Welfare",
] as const;

const GROUP_LABELS: Record<string, string> = {
  "Executive Committee": "Executive Comm",
  Technology: "Tech",
  Ambassadors: "Ambass",
  "Creative Marketing": "Creative Marketing",
  PPD: "PPD",
  Press: "Press",
  Welfare: "Welfare",
};

function slugifyAnchor(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

export default function Committee() {
  const [width, setWidth] = useState(0);
  const [columns, setColumns] = useState<2 | 3>(3);

  const committeeData = useMemo(() => {
    return COMMITTEE_MEMBERS.reduce(
      (acc, member) => {
        const groupName = member.committeeGroup;
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(member);
        return acc;
      },
      {} as Record<string, typeof COMMITTEE_MEMBERS>
    );
  }, []);

  const orderedCommitteeGroups = useMemo(() => {
    const priority = new Set(GROUP_ORDER);
    const ordered = GROUP_ORDER.filter((groupName) => committeeData[groupName]).map(
      (groupName) => [groupName, committeeData[groupName]] as const
    );
    const remaining = Object.entries(committeeData).filter(
      ([groupName]) => !priority.has(groupName as (typeof GROUP_ORDER)[number])
    );
    return [...ordered, ...remaining];
  }, [committeeData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setWidth(window.innerWidth);
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (width >= 768) {
      setColumns(3);
    } else {
      setColumns(2);
    }
  }, [width]);

  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start min-h-screen pb-16">
      <div className="w-full h-[25vh] md:h-[35vh] lg:h-[50vh]">
        <img
          src="/test_img2.png"
          alt="PINUS Committee"
          className="w-full h-full object-cover object-center"
        />
      </div>
      <div className="w-full">
        <TitleHeader text="Our Committee" color="blue" />
      </div>
      <div className="flex w-full justify-center p-4 whitespace-nowrap">
        <div className="flex flex-row overflow-x-auto gap-5 no-scrollbar">
          {orderedCommitteeGroups.map(([groupName]) => (
            <Link key={groupName} href={`#${slugifyAnchor(groupName)}`}>
              <Button className="border-2 hover:bg-white hover:text-blue-main hover:border-blue-main">
                {GROUP_LABELS[groupName] ?? groupName}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <div className="w-full flex flex-col gap-y-16 p-4">
        {orderedCommitteeGroups.map(([groupName, members]) => (
          <div
            className="flex flex-col justify-center scroll-m-24 gap-4"
            key={groupName}
            id={slugifyAnchor(groupName)}
          >
            <CommCardGroupTitle>{GROUP_LABELS[groupName] ?? groupName}</CommCardGroupTitle>
            {COMMITTEE_GROUP_PHOTOS[groupName]?.trim() ? (
              <img
                src={COMMITTEE_GROUP_PHOTOS[groupName]}
                alt={`${GROUP_LABELS[groupName] ?? groupName} group`}
                className="w-full max-w-6xl aspect-[21/9] object-cover rounded-xl mx-auto"
              />
            ) : null}
            <CommCardGroup columns={columns} gap={5}>
              {members.map((member) => (
                <CommCard key={member.id}>
                  <CommCardImage
                    src={member.photo?.trim() ? member.photo : "/test_img.jpg"}
                    alt={member.name}
                    width={256}
                    height={224}
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
        ))}
      </div>
    </main>
  );
}
