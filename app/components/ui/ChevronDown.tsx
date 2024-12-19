import * as React from "react";

interface ChevronDownProps {
  size?: number;
  color?: string;
  className?: string;
}

export const ChevronDown: React.FC<ChevronDownProps> = ({
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
    <path d="M6 9l6 6 6-6" />
  </svg>
);
