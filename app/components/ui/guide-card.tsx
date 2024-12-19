import React from "react";
import { cn } from "../lib/utils";

export const GuideCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("font-figtree flex", className)}>{children}</div>;

export const GuideCardDecoration = ({
  className,
  color,
  size,
}: {
  className?: string;
  color: "blue" | "yellow" | "red" | "black";
  size: number;
}) => {
  const colors = {
    blue: "bg-blue-main",
    yellow: "bg-yellow-main",
    red: "bg-red-main",
    black: "bg-black-main",
  };

  return (
    <div
      className={cn("h-24", colors[color], className)}
      style={{ width: `${size}px` }}
    />
  );
};

export const GuideCardBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("ml-8", className)}>{children}</div>;

export const GuideCardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("font-semibold text-lg mb-4", className)}>{children}</div>
);

export const GuideCardText = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("text-md flex flex-col gap-4", className)}>{children}</div>
);
