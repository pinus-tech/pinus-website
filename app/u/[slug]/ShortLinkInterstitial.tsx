"use client";

import React, { useCallback, useEffect, useState } from "react";

const COUNTDOWN_START = 5;

export default function ShortLinkInterstitial({
  targetUrl,
}: {
  targetUrl: string;
}) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_START);

  const redirect = useCallback(() => {
    window.location.href = targetUrl;
  }, [targetUrl]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (secondsLeft <= 1) {
        redirect();
        return;
      }
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [secondsLeft, redirect]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/90 px-4 py-12">
      <div className="mb-10 flex items-center gap-3 sm:gap-4">
        <img
          src="/logo-icon-pinus.svg"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 sm:h-14 sm:w-14"
        />
        <img
          src="/logo-text-pinus.svg"
          alt="PINUS"
          className="h-5 w-auto shrink-0 sm:h-6"
        />
      </div>

      <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white px-6 py-8 shadow-lg shadow-slate-200/50 sm:px-10">
        <h1 className="text-center text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
          You are leaving PINUS
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
          You will be redirected to the target URL in{" "}
          <span
            className="font-semibold tabular-nums text-slate-900"
            aria-live="polite"
            aria-atomic="true"
          >
            {secondsLeft}
          </span>{" "}
          {secondsLeft === 1 ? "second" : "seconds"}.
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Target URL
          </p>
          <p className="mt-1.5 break-all font-mono text-sm text-indigo-900">
            {targetUrl}
          </p>
        </div>

        <button
          type="button"
          onClick={redirect}
          className="mt-6 w-full rounded-lg bg-blue-main px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:opacity-90"
        >
          Redirect now
        </button>
      </div>
    </div>
  );
}
