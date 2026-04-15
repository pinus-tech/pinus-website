"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { buildLoginUrl } from "@/lib/login-callback";
import { useAuth } from "@/lib/contexts/AuthContext";
import AdminShortLinksPanel from "@/app/components/admin/AdminShortLinksPanel";

export default function AdminShortLinksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return;
    if (user === null) {
      router.push(buildLoginUrl(pathname));
      return;
    }
    if (!user.isAdmin) {
      router.push("/");
      return;
    }
  }, [user, authLoading, router, pathname]);

  if (authLoading || user === null || !user?.isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Short links
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Create and manage PINUS short URLs (
            <code className="rounded bg-slate-200/70 px-1 text-xs text-slate-800">
              /u/…
            </code>
            ). This admin-only page is not linked from the public site menu.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            <Link
              href="/admin/dashboard"
              className="font-medium text-indigo-700 underline-offset-2 hover:underline"
            >
              ← Member dashboard
            </Link>
          </p>
        </div>

        <AdminShortLinksPanel />
      </div>
    </div>
  );
}
