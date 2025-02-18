"use client";

import React, { useEffect, useRef } from "react";
import { NotionRenderer } from "react-notion-x";
import { ExtendedRecordMap } from "notion-types";
import { usePathname, useSearchParams } from "next/navigation";

interface RendererProps {
  recordMap: ExtendedRecordMap;
}

export default function Renderer({ recordMap }: RendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (hash && containerRef.current) {
        const id = hash.replace("#", "");
        const element = id ? document.getElementById(id) : null;
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        }
      }
    };

    scrollToHash();

    window.addEventListener("hashchange", scrollToHash);

    return () => {
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, [pathname, searchParams]);

  const Link = ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isHashLink = href?.startsWith("#");

    const handleClick = (
      e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
    ) => {
      if (isHashLink) {
        e.preventDefault();
        const id = href?.replace("#", "");
        const element = id ? document.getElementById(id) : null;
        if (element) {
          window.history.pushState(null, "", href);
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    };

    return (
      <a href={href} onClick={handleClick} {...props}>
        {children}
      </a>
    );
  };

  const Collection = () => null;

  return (
    <div ref={containerRef}>
      <NotionRenderer
        recordMap={recordMap}
        components={{
          Link,
          Collection,
        }}
        mapPageUrl={(pageId) => `/guides/${pageId}`}
        fullPage={false}
      />
    </div>
  );
}
