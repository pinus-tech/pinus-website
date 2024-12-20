import * as React from "react";
import { cn } from "../lib/utils";
import Image from "next/image";

export const CommCardGroup = ({
  children,
  className,
  columns,
  gap,
}: {
  children: React.ReactNode;
  className?: string;
  columns: 2 | 3;
  gap: number;
}) => {
  const childrenArray = React.Children.toArray(children);
  const totalItems = childrenArray.length;
  const rows = Math.floor(totalItems / columns);
  const remainder = totalItems % columns;
  const mainItems = childrenArray.slice(0, rows * columns);
  const remainingItems = childrenArray.slice(rows * columns);

  const gridCol = columns === 2 ? "grid-cols-2" : "grid-cols-3";
  const gridGap = gap ? `gap-${gap}` : "gap-4";

  return (
    <div className={cn("flex flex-col items-center", gridGap, className)}>
      {/* Main */}
      {mainItems.length > 0 && (
        <div className={cn("grid", gridCol, gridGap)}>
          {mainItems.map((child, index) => (
            <div key={index}>{child}</div>
          ))}
        </div>
      )}

      {/* Remainder */}
      {remainder > 0 && (
        <div
          className={cn("grid", gridGap, {
            "grid-cols-1 justify-center": remainder === 1,
            "grid-cols-2 justify-between": remainder === 2,
          })}
          style={{
            gridTemplateColumns: `repeat(${remainder}, minmax(0, 1fr))`,
          }}
        >
          {remainingItems.map((child, index) => (
            <div key={index} className="flex justify-center">
              {child}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const CommCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "font-figtree max-w-sm overflow-hidden flex flex-col items-center",
      className
    )}
  >
    {children}
  </div>
);

export const CommCardImage = ({
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
    className={cn("w-64 h-56 object-cover bg-center rounded-xl", className)}
    src={src}
    alt={alt}
    width={width}
    height={height}
  />
);

export const CommCardHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "px-4 pt-2 flex flex-col gap-0 items-center justify-center",
      className
    )}
  >
    {children}
  </div>
);

export const CommCardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("font-semibold text-md text-center", className)}>
    {children}
  </div>
);

export const CommCardDescription = ({
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
      "text-gray-600 font-medium text-center text-xs",
      italic && "italic",
      className
    )}
  >
    {children}
  </p>
);
