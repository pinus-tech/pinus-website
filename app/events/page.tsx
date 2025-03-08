"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TitleHeader } from "../components/ui/title";
import { Button } from "../components/ui/button";
import { BlurFade } from "../components/ui/blur-fade";
import {
  Card,
  CardImage,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardBadge,
  CardTags
} from "../components/ui/card";
import { events, all_events } from "./data";

const BLUR_FADE_DELAY = 0.04;
const COLORS: Array<"yellow" | "red" | "blue" | "black"> = [
  "yellow",
  "red",
  "blue",
];

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type");

  const [selected, setSelected] = useState<"All" | "Executive Committee" | "Creative Marketing" | "PPD" | "Ambassador" | "Press" | "Welfare" | "Tech" | "Orientation Committee">(
    queryType === "All" ? "All" : 
    queryType === "Executive Committee" ? "Executive Committee" :
    queryType === "Creative Marketing" ? "Creative Marketing" :
    queryType === "PPD" ? "PPD" :
    queryType === "Ambassador" ? "Ambassador" :
    queryType === "Press" ? "Press" :
    queryType === "Welfare" ? "Welfare" :
    queryType === "Tech" ? "Tech" :
    queryType === "" ? "All" : "All"
  );

  useEffect(() => {
    router.push(`?type=${selected}`);
  }, [selected, router]);

  const handleToggle = (option: "All" | "Executive Committee" | "Creative Marketing" | "PPD" | "Ambassador" | "Press" | "Welfare" | "Tech" | "Orientation Committee") => {
    if (option !== selected) {
      setSelected(option);
    }
  };

  const categories = ["All", "Executive Committee", "Creative Marketing", "PPD", "Ambassador", "Press", "Welfare", "Tech", "Orientation Committee"];


  return (
    <>
      {/* Buttons */}
      <div className="w-full">
        <BlurFade delay={BLUR_FADE_DELAY * 1.5} className="my-8" inView>
          <div className="flex overflow-x-auto space-x-2 lg:w-full sm:w-full w-1/2 justify-center">
            {categories.slice(0,-1).map((cat, index) => (
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
      <BlurFade key={`cards-${selected}`} delay={BLUR_FADE_DELAY * 4} inView>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 px-4 sm:px-0 justify-items-center">
          {(selected === "All" ? all_events :  events.find(eventCategory => eventCategory.category === selected)?.events || []).map(
            (event, index) => (
              <Card key={index} className="flex flex-col h-full max-w-xs w-full">
                <CardImage 
                  src={event.thumbnail}
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
            )
          )}
        </div>
      </BlurFade>
    </>
  );
}

export default function Events() {
  return (
    <div className="flex flex-col gap-8 items-center min-h-screen">
      {/* Header */}

      <div className="w-full h-[25vh] md:h-[35vh] lg:h-[50vh]">
        <img
          src="/test_img2.png"
          alt="PINUS Committee Image"
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="px-8 justify-center md:px-72 py-2 md:py-5 pb-20 md:pb-20">
        <BlurFade key="header" delay={BLUR_FADE_DELAY} inView>
          <TitleHeader text="Events" color="blue" />
        </BlurFade>
          <EventsContent />
        <Suspense fallback={<div></div>}>
        </Suspense>
      </div>
    </div>
  );
}
