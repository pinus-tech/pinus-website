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
  const isOdd = childrenArray.length % 2 === 1;
  const remaining = childrenArray.length % columns;
  const mainItems = childrenArray.slice(0, childrenArray.length - remaining);
  const remainingItems = childrenArray.slice(-remaining);

  const gridCol = columns === 2 ? "grid-col-2" : "grid-cols-3";
  const gridGap = gap ? `gap-${gap}` : "gap-4";
  const spacing = "space-y-" + String(gap);

  return columns === 2 ? (
    <div className={cn("grid", gridGap, gridCol, className)}>
      {childrenArray.map((child, index) => {
        const isLast = index === childrenArray.length - 1;
        return isOdd && isLast ? (
          <div key={index} className="col-span-2 flex justify-center">
            <div className="max-w-[50%]">{child}</div>
          </div>
        ) : (
          child
        );
      })}
    </div>
  ) : (
    <div className={cn(spacing, className)}>
      {columns === 3 && remaining > 0 && (
        <div className={`grid ${gridGap}`}>
          <div className="col-span-3 flex justify-center">
            <div
              className={cn(
                "grid",
                gridGap,
                remaining === 1 ? "max-w-[33%]" : "max-w-[66%]",
                remaining === 2 ? "grid-cols-2" : "grid-cols-1"
              )}
            >
              {remainingItems}
            </div>
          </div>
        </div>
      )}

      {mainItems.length > 0 && (
        <div className={cn("grid", gridCol, gridGap)}>{mainItems}</div>
      )}

      {remaining === 1 && (
        <div className="flex justify-center">
          <div className="max-w-[50%]">{remainingItems}</div>
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
