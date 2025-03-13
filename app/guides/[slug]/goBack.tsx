"use client";

import { useEffect } from "react";
import { ChevronLeft } from "../../components/ui/ChevronLeft";

export function RedirectToGuides() {
  useEffect(() => {
    const handleRedirect = () => {
      window.location.href = "/guides";
    };

    document
      .getElementById("redirect-button")
      ?.addEventListener("click", handleRedirect);

    return () => {
      document
        .getElementById("redirect-button")
        ?.removeEventListener("click", handleRedirect);
    };
  }, []);

  return (
    <div id="redirect-button" className="cursor-pointer">
      <ChevronLeft className="h-8 w-8" />
    </div>
  );
}
