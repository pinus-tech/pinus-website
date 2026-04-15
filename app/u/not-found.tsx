import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Link not found | PINUS",
  robots: { index: false, follow: false },
};

export default function ShortLinkNotFound() {
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
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white px-6 py-8 text-center shadow-lg shadow-slate-200/50">
        <h1 className="text-lg font-semibold text-slate-900">Link not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          This short URL does not exist or is no longer available.
        </p>
      </div>
    </div>
  );
}
