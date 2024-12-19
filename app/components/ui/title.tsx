"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";

export const TitleHeader = ({
  text,
  color,
  className,
  textClassName,
  underlineClassName,
}: {
  text: string;
  color: string;
  className?: string;
  textClassName?: string;
  underlineClassName?: string;
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [underlineWidth, setUnderlineWidth] = useState<number>(0);

  useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.getBoundingClientRect().width;
      setUnderlineWidth(width + 20);
    }
  }, [text]);

  const getUnderlineColor = () => {
    switch (color) {
      case "blue":
        return "bg-blue-main";
      case "red":
        return "bg-red-main";
      case "yellow":
        return "bg-yellow-main";
      default:
        return "bg-black-main";
    }
  };

  return (
    <div
      className={cn(
        "font-figtree py-2 px-3 flex flex-col items-center justify-center",
        className
      )}
    >
      <div
        ref={textRef}
        className={cn("font-bold text-2xl pb-3 inline-block", textClassName)}
      >
        {text}
      </div>
      <div
        style={{ width: `${underlineWidth}px` }}
        className={cn("h-1", getUnderlineColor(), underlineClassName)}
      />
    </div>
  );
};

export default TitleHeader;
