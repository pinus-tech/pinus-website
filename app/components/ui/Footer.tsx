"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const exploreLinks = [
  { href: "/", label: "Home" },
  { href: "/committee", label: "Committee" },
  { href: "/events", label: "Events" },
  { href: "/guides", label: "Guides" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
];

const participateLinks = [
  { href: "/forms", label: "Forms" },
  { href: "/marketplace", label: "Marketplace" },
];

const externalApps = [
  {
    href: "https://www.pinusstudy.com/",
    label: "PINUS Study",
    description: "Study resources & programmes",
  },
];

const accountLinks = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Register" },
  { href: "/profile", label: "Profile" },
];

/** Display year in site footer copyright. */
const COPYRIGHT_YEAR = 2026;

const Footer = () => {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/u/")) {
    return null;
  }

  return (
    <footer className="bg-blue-main text-white">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          <div>
            <h2 className="mb-4 text-lg font-bold tracking-wide">Explore</h2>
            <ul className="space-y-2.5 text-sm">
              {exploreLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="opacity-95 hover:opacity-100 hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold tracking-wide">Participate</h2>
            <ul className="space-y-2.5 text-sm">
              {participateLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="opacity-95 hover:opacity-100 hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold tracking-wide">Account</h2>
            <ul className="space-y-2.5 text-sm">
              {accountLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="opacity-95 hover:opacity-100 hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-white/70">
              <Link href="/contact-us" className="hover:underline">
                Contact us
              </Link>
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold tracking-wide">
              External apps
            </h2>
            <ul className="space-y-3 text-sm">
              {externalApps.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {item.label}
                  </a>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-white/75">
                      {item.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:col-span-2 lg:col-span-1">
            <h2 className="mb-4 text-lg font-bold tracking-wide">Connect</h2>
            <div className="mb-4 flex flex-wrap gap-4">
              <Link
                href="https://www.instagram.com/pinusonline"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/ic-instagram-white.svg"
                  alt="Instagram"
                  className="h-10 w-10"
                />
              </Link>
              <Link
                href="https://www.facebook.com/PerhimpunanIndonesiaNUS"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/ic-facebook-white.svg"
                  alt="Facebook"
                  className="h-10 w-10"
                />
              </Link>
              <Link
                href="https://www.youtube.com/channel/UCfYU_ttUpJWNEKIbiWoQQHQ"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/ic-youtube-white.svg"
                  alt="YouTube"
                  className="h-10 w-10"
                />
              </Link>
            </div>
            <p className="text-sm text-white/80">© {COPYRIGHT_YEAR} PINUS</p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/20 pt-6 text-center text-xs text-white/70">
          Perhimpunan Indonesia NUS -{" "}
          <Link href="/contact-us" className="hover:underline">
            Get in touch
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
