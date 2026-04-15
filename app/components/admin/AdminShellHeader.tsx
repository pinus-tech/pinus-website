"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/app/components/ui/button";

export default function AdminShellHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-[60] border-b border-slate-200/90 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 rounded-lg py-1 pr-2 text-slate-900 transition-opacity hover:opacity-85"
          >
            <img
              src="/logo-text-pinus.svg"
              alt="PINUS"
              className="h-4 w-auto shrink-0 sm:h-[1.15rem]"
            />
            <span
              className="hidden h-4 w-px shrink-0 bg-slate-300 sm:block"
              aria-hidden
            />
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:inline">
              Admin
            </span>
          </Link>
          <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-100">
            Console
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline"
          >
            View site
          </Link>
          <span className="hidden max-w-[10rem] truncate text-sm text-slate-600 md:inline">
            {user?.name}
          </span>
          <Button onClick={handleLogout} variant="red" size="sm">
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
