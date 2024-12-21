import { cn } from "../lib/utils";

type SkeletonColor = "blue" | "yellow" | "red" | "black" | "muted";

function Skeleton({
  skeletonColor = "blue",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { skeletonColor?: SkeletonColor }) {
  const colorUsed =
    skeletonColor === "muted" ? "bg-muted" : `bg-${skeletonColor}-main-10`;

  return (
    <div
      className={cn("animate-pulse rounded-md", colorUsed, className)}
      {...props}
    />
  );
}

export { Skeleton };
