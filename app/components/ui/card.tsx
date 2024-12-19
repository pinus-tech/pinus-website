import React from "react";
import { cn } from "../lib/utils";
import Image from "next/image";

export const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "font-figtree max-w-sm rounded-xl overflow-hidden shadow-lg",
      className
    )}
  >
    {children}
  </div>
);

export const CardImage = ({
  src,
  alt,
  className,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
}) => (
  <Image
    className={cn("w-full bg-center object-cover", className)}
    src={src}
    alt={alt}
    width={width}
    height={height}
  />
);

export const CardHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("px-4 pt-4", className)}>{children}</div>;

export const CardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("font-bold text-2xl mb-1", className)}>{children}</div>
);

export const CardDescription = ({
  children,
  italic,
  className,
}: {
  children: React.ReactNode;
  italic?: boolean;
  className?: string;
}) => (
  <p
    className={cn(
      "text-black text-base text-md font-medium",
      italic && "italic",
      className
    )}
  >
    {children}
  </p>
);

export const CardContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("px-4 pt-2 text-md font-medium", className)}>
    {children}
  </div>
);

export const CardFooter = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("px-4 pt-2 pb-4 flex gap-3", className)}>{children}</div>
);

export const CardTags = ({
  teamName,
  eventType,
  className,
}: {
  teamName: string;
  eventType: string;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-2 text-sm", className)}>
    <Image
      src="/ic-tags.svg"
      width={20}
      height={20}
      className="w-4 h-4"
      alt="tags"
    />
    <div className="underline text-blue-main font-semibold">{teamName}</div>
    <div className="text-blue-main font-semibold">{eventType}</div>
  </div>
);

export const CardBadge = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "bg-blue-main text-white text-md px-2 py-0.5 rounded-xl font-bold",
      className
    )}
  >
    {children}
  </div>
);
