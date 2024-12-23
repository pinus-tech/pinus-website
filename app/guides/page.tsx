"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TitleHeader } from "../components/ui/title";
import { Button } from "../components/ui/button";
import { BlurFade } from "../components/ui/blur-fade";
import {
  GuideCard,
  GuideCardDecoration,
  GuideCardBody,
  GuideCardTitle,
  GuideCardText,
} from "../components/ui/guide-card";
import { before_acceptance, after_acceptance } from "./data";
import Image from "next/image";

const BLUR_FADE_DELAY = 0.04;
const COLORS: Array<"yellow" | "red" | "blue" | "black"> = [
  "yellow",
  "red",
  "blue",
];

function GuidesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type");

  const [selected, setSelected] = useState<"before" | "after">(
    queryType === "after" ? "after" : "before"
  );

  useEffect(() => {
    router.push(`?type=${selected}`);
  }, [selected, router]);

  const handleToggle = (option: "before" | "after") => {
    if (option !== selected) {
      setSelected(option);
    }
  };

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

      {/* Content Section */}
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
      <BlurFade key={`cards-${selected}`} delay={BLUR_FADE_DELAY * 4} inView>
        <div className="flex flex-col md:gap-12 gap-16">
          {(selected === "before" ? before_acceptance : after_acceptance).map(
            (guide, index) => (
              <GuideCard key={index}>
                <GuideCardDecoration
                  color={COLORS[index % COLORS.length]}
                  width={3}
                  height={80}
                />
                <GuideCardBody>
                  <GuideCardTitle>{guide.title}</GuideCardTitle>
                  {guide.image && (
                    <Image
                      src={guide.image}
                      width={200}
                      height={200}
                      className="w-full md:h-96 object-cover"
                      alt={`Image for ${guide.title}`}
                    />
                  )}
                  {guide.details.map((detail, index) => (
                    <GuideCardText key={index} className="mt-2">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {detail.subtitle}
                        </h3>
                        <p
                          className={`${
                            detail.subtitle ? "text-md" : "text-lg"
                          }`}
                        >
                          {detail.description}
                        </p>
                      </div>
                    </GuideCardText>
                  ))}
                </GuideCardBody>
              </GuideCard>
            )
          )}
        </div>
      </BlurFade>
    </>
  );
}

export default function Guides() {
  return (
    <div className="px-8 md:px-72 py-10">
      {/* Header */}
      <BlurFade key="header" delay={BLUR_FADE_DELAY} inView>
        <TitleHeader text="Guide" color="blue" />
      </BlurFade>

      <Suspense fallback={<div></div>}>
        <GuidesContent />
      </Suspense>
    </div>
  );
}
