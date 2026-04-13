"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TitleHeader } from "../components/ui/title";
import { Button } from "../components/ui/button";
import { BlurFade } from "../components/ui/blur-fade";
import { Skeleton } from "../components/ui/skeleton";
import {
  GuideCard,
  GuideCardDecoration,
  GuideCardBody,
  GuideCardTitle,
  GuideCardText,
} from "../components/ui/guide-card";
import Image from 'next/image'

const BLUR_FADE_DELAY = 0.02;

/** Notion guide descriptions use "Title—blockId" (em dash). `split("-")` fails on em dashes and breaks UUIDs. */
function splitGuideDescriptionLine(line: string): { label: string; blockId: string } {
  const trimmed = line.trim();
  if (!trimmed) return { label: "", blockId: "" };

  for (const sep of ["\u2014", "\u2013"]) {
    const idx = trimmed.indexOf(sep);
    if (idx !== -1) {
      const label = trimmed.slice(0, idx).trim();
      const rest = trimmed.slice(idx + sep.length).trim();
      return { label: label || trimmed, blockId: rest };
    }
  }

  const hyphenIdx = trimmed.indexOf("-");
  if (hyphenIdx > 0 && !trimmed.slice(hyphenIdx + 1).includes("-")) {
    return {
      label: trimmed.slice(0, hyphenIdx).trim(),
      blockId: trimmed.slice(hyphenIdx + 1).trim(),
    };
  }

  return { label: trimmed, blockId: "" };
}

interface NotionPage {
  object: "page";
  id: string;
  created_time: string;
  last_edited_time: string;
  created_by: NotionUser;
  last_edited_by: NotionUser;
  cover: null;
  icon: null;
  parent: NotionParent;
  archived: boolean;
  in_trash: boolean;
  properties: NotionProperties;
  url: string;
  public_url: string | null;
  request_id: string;
}

interface NotionUser {
  object: "user";
  id: string;
}

interface NotionParent {
  type: "database_id";
  database_id: string;
}

interface NotionProperties {
  Order: NotionNumberProperty;
  Subchapter: NotionSelectProperty;
  Chapter: NotionSelectProperty;
  Name: NotionTitleProperty;
  Description: NotionRichTextProperty;
}

interface NotionNumberProperty {
  id: string;
  type: "number";
  number: number;
}

interface NotionSelectProperty {
  id: string;
  type: "select";
  select: {
    id: string;
    name: string;
    color: string;
  };
}

interface NotionTitleProperty {
  id: string;
  type: "title";
  title: NotionTextContent[];
}

interface NotionRichTextProperty {
  id: string;
  type: "rich_text";
  rich_text: NotionTextContent[];
}

interface NotionTextContent {
  type: "text";
  text: {
    content: string;
    link: string | null;
  };
  annotations: NotionTextAnnotations;
  plain_text: string;
  href: string | null;
}

interface NotionTextAnnotations {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string;
}

function GuidesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type");

  const [selected, setSelected] = useState<"before" | "after">(
    queryType === "after" ? "after" : "before"
  );
  const [guidesContent, setGuidesContent] = useState<NotionPage[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(true);

  useEffect(() => {
    router.push(`?type=${selected}`, { scroll: false });
  }, [selected, router]);

  const handleToggle = (option: "before" | "after") => {
    if (option !== selected) {
      setSelected(option);
    }
  };

  useEffect(() => {
    async function fetchData() {
      setIsFetching(true);
      try {
        const data = await getGuides();
        setGuidesContent(data);
      } catch (error) {
        console.error("Error fetching data from Notion:", error);
      } finally {
        setIsFetching(false);
      }
    }
    fetchData();
  }, []);

  async function getGuides(): Promise<NotionPage[]> {
    const res = await fetch("/api/guides", {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch sharing sessions");
      return [];
    }

    const guidesContent: NotionPage[] = await res.json();
    return guidesContent;
  }

  const filteredGuides = guidesContent.filter((guide) => {
    const chapter = guide.properties.Chapter.select.name;
    return selected === "before"
      ? chapter === "Before Acceptance"
      : chapter === "After Acceptance";
  });

  return (
    <>
      {/* Toggle Buttons */}
      <BlurFade delay={BLUR_FADE_DELAY * 1.5} className="my-8" inView>
        <div className="flex gap-2 items-center justify-center">
          <Button
            rounding="2xl"
            className={selected === "before" ? "font-semibold" : ""}
            outline={selected !== "before"}
            onClick={() => handleToggle("before")}
          >
            Before Acceptance
          </Button>
          <Button
            rounding="2xl"
            className={selected === "after" ? "font-semibold" : ""}
            outline={selected !== "after"}
            onClick={() => handleToggle("after")}
          >
            After Acceptance
          </Button>
        </div>
      </BlurFade>

      {/* Content Section Header */}
      <BlurFade
        key={`content-${selected}`}
        delay={BLUR_FADE_DELAY * 1.5}
        inView
      >
        <div className="pt-6 md:pt-5 pb-6 md:pb-12 flex items-center justify-center">
          <h3 className="font-semibold text-xl">
            {selected === "before" ? "Before Acceptance" : "After Acceptance"}
          </h3>
        </div>
      </BlurFade>

      {/* Guide Cards */}
      <div className="space-y-6">
        {isFetching ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-8">
                <Skeleton
                  skeletonColor={selected === "before" ? "blue" : "red"}
                  className="w-1 h-[70px]"
                />
                <div className="flex-grow space-y-4">
                  <Skeleton
                    skeletonColor={selected === "before" ? "blue" : "red"}
                    className="h-6 w-3/4"
                  />
                  <div className="space-y-2">
                    <Skeleton
                      skeletonColor={selected === "before" ? "blue" : "red"}
                      className="h-4 w-full"
                    />
                    <Skeleton
                      skeletonColor={selected === "before" ? "blue" : "red"}
                      className="h-4 w-5/6"
                    />
                    <Skeleton
                      skeletonColor={selected === "before" ? "blue" : "red"}
                      className="h-4 w-4/6"
                    />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : filteredGuides.length > 0 ? (
          <>
            {filteredGuides.map((guide, index) => (
              <BlurFade
                key={guide.id}
                delay={BLUR_FADE_DELAY * (index + 1)}
                inView
              >
                <GuideContent
                  guide={guide}
                  onClick={(id) =>
                    router.push(`/guides/${guide.id}${id ? `#${id}` : ""}`)
                  }
                />
              </BlurFade>
            ))}
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            No guides available for this category.
          </div>
        )}
      </div>
    </>
  );
}

export default function Guides() {
  return (
    <div className="flex flex-col gap-8 row-start-2 items-center sm:items-start min-h-screen">
      {/* Header Image */}
      <div className="w-full relative h-[25vh] md:h-[35vh] lg:h-[50vh]">
        <Image
          src="/hero-guides.jpeg"
          fill
          objectFit="cover"
          alt="Picture of hero guides"
          className="w-full h-full top-0 left-0 object-cover"
        />
      </div> 

      <div className="px-8 md:px-72 py-2 md:py-5 pb-20 md:pb-20 w-full">
        <BlurFade key="header" delay={BLUR_FADE_DELAY} inView>
          <TitleHeader text="Guide" color="blue" />
        </BlurFade>

        <Suspense fallback={<div></div>}>
          <GuidesContent />
        </Suspense>
      </div>
    </div>
  );
}

function GuideContent({
  guide,
  onClick,
}: {
  guide: NotionPage;
  onClick: (id: string) => void;
}) {
  const color =
    guide.properties.Chapter.select.name === "Before Acceptance"
      ? "blue"
      : "red";

  return (
    <GuideCard className="group cursor-pointer hover:opacity-80 transition-opacity">
      <GuideCardDecoration color={color} width={4} height={70} />
      <GuideCardBody>
        <GuideCardTitle onClick={() => onClick("")}>
          {guide.properties.Name.title[0].plain_text}
        </GuideCardTitle>
        <GuideCardText>
          {guide.properties.Description?.rich_text?.length > 0 ? (
            guide.properties.Description.rich_text[0].plain_text
              .split("\n")
              .map((line, i) => {
                const { label, blockId } = splitGuideDescriptionLine(line);
                return (
                  <div
                    key={i}
                    className="italic cursor-pointer hover:underline"
                    onClick={() => onClick(blockId)}
                  >
                    {label}
                  </div>
                );
              })
          ) : (
            <div>No description available</div>
          )}
        </GuideCardText>
      </GuideCardBody>
    </GuideCard>
  );
}
