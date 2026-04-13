"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

export type NavDropdownItem = { href: string; label: string };

export function NavDropdown({
  label,
  items,
  align = "start",
}: {
  label: string;
  items: NavDropdownItem[];
  align?: "start" | "end";
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 outline-none",
          "hover:bg-gray-50 hover:text-blue-main data-[state=open]:text-blue-main"
        )}
      >
        {label}
        <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={6}
          className="z-[60] min-w-[12rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {items.map((item) => (
            <DropdownMenu.Item key={item.href} asChild>
              <Link
                href={item.href}
                className="block cursor-pointer px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-50"
              >
                {item.label}
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
