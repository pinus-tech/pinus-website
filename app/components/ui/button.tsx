import React from "react";
import { cn } from "../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: keyof typeof buttonVariant;
  size?: keyof typeof buttonSize;
  outline?: boolean;
  rounding?: "full" | "3xl" | "2xl" | "xl" | "lg" | "md" | "sm" | "none";
}

const buttonVariant = {
  blue: {
    solid: "text-white bg-blue-main hover:bg-blue-main/90",
    outline: "text-blue-main border border-blue-main hover:bg-blue-main-10",
  },
  yellow: {
    solid: "text-white bg-yellow-main hover:bg-yellow-main/90",
    outline:
      "text-yellow-main border border-yellow-main hover:bg-yellow-main-10",
  },
  red: {
    solid: "text-white bg-red-main hover:bg-red-main/90",
    outline: "text-red-main border border-red-main hover:bg-red-main-10",
  },
  black: {
    solid: "text-white bg-black-main hover:bg-black-main/90",
    outline: "text-black-main border border-black-main hover:bg-black-main-10",
  },
};

const buttonSize = {
  sm: "py-1 px-2 text-sm",
  md: "py-1.5 px-3.5 text-base",
  lg: "py-3 px-6 text-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "blue",
      size = "md",
      outline = false,
      rounding = "xl",
      ...props
    },
    ref
  ) => {
    const variantStyle = outline
      ? buttonVariant[variant].outline
      : buttonVariant[variant].solid;

    const borderRadiusClass =
      rounding === "none"
        ? "rounded-none"
        : rounding === "full"
        ? "rounded-full"
        : `rounded-${rounding}`;

    return (
      <button
        className={cn(
          "font-figtree",
          variantStyle,
          buttonSize[size],
          "transition-colors duration-200",
          borderRadiusClass,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;
