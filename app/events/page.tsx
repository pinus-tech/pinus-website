"use client";

export const runtime = "edge";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TitleHeader } from "../components/ui/title";
import { Button } from "../components/ui/button";
import { BlurFade } from "../components/ui/blur-fade";
import {
  Card,
  CardImage,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardBadge,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

interface PINUSEvent {
  title: string;
  description: string;
  thumbnail?: string; // Thumbnail is optional
  subcom: string;
}

const BLUR_FADE_DELAY = 0.04;
const categories = [
  "All",
  "Core Exco",
  "Creative Marketing",
  "PPD",
  "Ambassador",
  "Press",
  "Welfare",
  "Tech",
];

async function getEvents(category: string): Promise<PINUSEvent[]> {
  const url =
    category === "All"
      ? `/api/events/`
      : `/api/events?subcomm=${encodeURIComponent(category)}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch events");
  }
  return res.json();
}

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type") || "All";

  const [selected, setSelected] = useState<(typeof categories)[number]>(
    categories.includes(queryType) ? queryType : "All"
  );
  const [events, setEvents] = useState<PINUSEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const eventsData = await getEvents(selected);
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selected]);

  useEffect(() => {
    if (queryType !== selected) {
      router.replace(`?type=${selected}`, { scroll: false });
    }
  }, [selected, queryType, router]);

  const handleToggle = (category: string) => {
    setSelected(category);
  };

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    setTimeout(() => {
      if (buttonRefs.current[0]) {
        buttonRefs.current[0].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }, 300); // Slight delay to ensure render is complete
  }, []);

  return (
    <>
      {/* Buttons */}
      <div className="w-full flex justify-center mx-auto">
        <BlurFade
          delay={BLUR_FADE_DELAY * 1.5}
          className="my-8 mx-auto flex justify-center items-center"
          inView
        >
          <div className="flex overflow-x-auto w-full md:max-w-5xl max-w-xs justify-start px-4 gap-4 items-center pb-2">
            {categories.map((cat, index) => (
              <section key={index} className="flex-shrink-0">
                <span>
                  <Button
                    rounding="2xl"
                    className={selected === cat ? "font-semibold" : ""}
                    outline={selected !== cat}
                    onClick={() => handleToggle(cat)}
                  >
                    {cat}
                  </Button>
                </span>
              </section>
            ))}
          </div>
        </BlurFade>
      </div>

      {/* Event Cards */}
      {loading ? (
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 px-4 sm:px-0 justify-items-center">
            {[...Array(6)].map((_, index) => (
              <BlurFade
                delay={BLUR_FADE_DELAY * (index + 1.5)}
                key={index}
                className="flex flex-col h-full max-w-xs w-full"
                inView
              >
                <Skeleton className="rounded-xl h-48 w-full" />
                <Skeleton className="mt-4 h-6 w-3/4" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
                <Skeleton className="mt-4 h-6 w-1/4" />
              </BlurFade>
            ))}
          </div>
        </div>
      ) : events.length === 0 ||
        (selected != "All" && events[0].subcom != selected) ? (
        <BlurFade delay={BLUR_FADE_DELAY * 1} inView>
          <div className="text-center text-gray-500">No events found.</div>
        </BlurFade>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 px-4 sm:px-0 justify-items-center">
          {events.map((event, index) => (
            <BlurFade
              delay={BLUR_FADE_DELAY * (index + 1.5)}
              inView
              key={index}
            >
              <Card className="flex flex-col h-full max-w-xs w-full">
                <CardImage
                  src={
                    event.thumbnail && event.thumbnail !== "No Image"
                      ? event.thumbnail
                      : "/test_img2.png"
                  }
                  alt={`Image for ${event.title}`}
                  className="rounded-xl h-48 object-cover"
                  width={1000}
                  height={1000}
                />
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p>{event.description}</p>
                </CardContent>
                <CardFooter>
                  <CardBadge>{event.subcom}</CardBadge>
                </CardFooter>
              </Card>
            </BlurFade>
          ))}
        </div>
      )}
    </>
  );
}

export default function Events() {
  return (
    <div className="flex flex-col gap-8 items-center min-h-screen">
      <div className="w-full h-[25vh] md:h-[35vh] lg:h-[50vh]">
        <img
          src="/test_img2.png"
          alt="PINUS Committee Image"
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="px-8 justify-center py-4 md:py-10">
        <BlurFade key="header" delay={BLUR_FADE_DELAY} inView>
          <TitleHeader text="Events" color="blue" />
        </BlurFade>
        <EventsContent />
      </div>
    </div>
  );
}
