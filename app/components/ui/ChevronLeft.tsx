import * as React from "react";

interface ChevronLeftProps {
  size?: number;
  color?: string;
  className?: string;
}

export const ChevronLeft: React.FC<ChevronLeftProps> = ({
  size = 24,
  color = "currentColor",
  className,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);
