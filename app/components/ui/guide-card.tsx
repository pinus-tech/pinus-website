import React from "react";
import { cn } from "../lib/utils";

export const GuideCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("font-figtree flex w-full", className)}>{children}</div>
);

export const GuideCardDecoration = ({
  className,
  color,
  width,
  height,
}: {
  className?: string;
  color: "blue" | "yellow" | "red" | "black";
  width: number;
  height: number;
}) => {
  const colors = {
    blue: "bg-blue-main",
    yellow: "bg-yellow-main",
    red: "bg-red-main",
    black: "bg-black-main",
  };

  return (
    <div
      className={cn(colors[color], "flex-shrink-0", className)}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        minWidth: `${width}px`, // Prevent shrinking
      }}
    />
  );
};

export const GuideCardBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("md:ml-8 ml-6 flex-grow", className)}>{children}</div>;

export const GuideCardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("font-semibold text-lg mb-2", className)}>{children}</div>
);

export const GuideCardText = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("text-md flex flex-col gap-4 w-full", className)}>
    {children}
  </div>
);
