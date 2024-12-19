import React from "react";

export const Check = ({ color = "#222E89", className = "", ...props }) => {
  return (
    <svg
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"
        fill={color}
      />
    </svg>
  );
};
