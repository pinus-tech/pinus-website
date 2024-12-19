"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "../lib/utils";
import { CaretDown } from "./CaretDown";
import { ChevronDown } from "./ChevronDown";
import { Check } from "./Check";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  variant?: "blue" | "yellow" | "red" | "black";
  size?: keyof typeof buttonSize;
  outline?: boolean;
  rounding?: "full" | "xl" | "lg" | "md" | "sm" | "none";
}

const buttonVariant = {
  blue: {
    solid: "text-white bg-blue-main hover:bg-blue-main/90",
    outline: "text-blue-main border border-blue-main hover:bg-blue-main/10",
  },
  yellow: {
    solid: "text-white bg-yellow-main hover:bg-yellow-main/90",
    outline:
      "text-yellow-main border border-yellow-main hover:bg-yellow-main/10",
  },
  red: {
    solid: "text-white bg-red-main hover:bg-red-main/90",
    outline: "text-red-main border border-red-main hover:bg-red-main/10",
  },
  black: {
    solid: "text-white bg-black-main hover:bg-black-main/90",
    outline: "text-black-main border border-black-main hover:bg-black-main/10",
  },
};

const buttonSize = {
  sm: "py-1 px-2 text-sm",
  md: "py-2 px-4 text-base",
  lg: "py-3 px-6 text-lg",
};

const variantColors = {
  blue: "var(--blue-main)",
  yellow: "var(--yellow-main)",
  red: "var(--red-main)",
  white: "var(--white-main)",
  black: "var(--black-main)",
};

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(
  (
    {
      className,
      variant = "blue",
      size = "md",
      outline = false,
      rounding,
      children,
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

    const iconColor = outline ? variantColors[variant] : "white";

    return (
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          variantStyle,
          buttonSize[size],
          "transition-colors duration-200 font-figtree",
          borderRadiusClass,
          "flex w-full items-center justify-between h-fit",
          "focus:outline-none focus:ring-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[&>span]:line-clamp-1",
          className
        )}
        {...props}
      >
        {children}
        <SelectPrimitive.Icon
          asChild
          className="flex items-center justify-center"
        >
          <CaretDown color={iconColor} className="w-2.5 h-2.5" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    );
  }
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4 rotate-180" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  variant?: keyof typeof buttonVariant;
  outline?: boolean;
  rounding?: "full" | "xl" | "lg" | "md" | "sm" | "none";
}

interface SelectItemProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  variant?: keyof typeof buttonVariant;
  isColor?: boolean;
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(
  (
    {
      className,
      children,
      position = "popper",
      variant = "blue",
      outline = false,
      rounding = "xl",
      ...props
    },
    ref
  ) => {
    const borderRadiusClass =
      rounding === "none"
        ? "rounded-none"
        : rounding === "full"
        ? "rounded-full"
        : `rounded-${rounding}`;

    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref}
          className={cn(
            "relative z-50 max-h-96 min-w-[8rem] overflow-hidden border shadow-md font-figtree",
            borderRadiusClass,
            outline
              ? "bg-white"
              : variant === "blue"
              ? "bg-blue-main"
              : variant === "red"
              ? "bg-red-main"
              : variant === "yellow"
              ? "bg-yellow-main"
              : "bg-black-main",
            outline ? `border-${variant}-main` : "border-transparent",
            !outline &&
              (variant === "blue" || variant === "red" || variant === "black")
              ? "text-white"
              : "text-black",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            position === "popper" &&
              "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            className
          )}
          position={position}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.Viewport
            className={cn(
              "p-1",
              position === "popper" &&
                "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
            )}
          >
            {children}
          </SelectPrimitive.Viewport>
          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    );
  }
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ className, children, isColor, variant = "blue", ...props }, ref) => {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm",
        "cursor-pointer",
        "outline-none",
        `hover:bg-${variant}-main/10`,
        `focus:bg-${variant}-main/20`,
        `data-[highlighted]:bg-${variant}-main/10`,
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check
            className={cn("h-4 w-4")}
            color={isColor ? "#ffffff" : variantColors[variant]}
          />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
