import React from "react";
import Link from "next/link";

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
  { href: "/sharing-sessions", label: "Sharing sessions" },
  { href: "/pbl", label: "PBL" },
];

const accountLinks = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Register" },
  { href: "/profile", label: "Profile" },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-blue-main text-white">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <h2 className="mb-4 text-lg font-bold tracking-wide">Explore</h2>
            <ul className="space-y-2.5 text-sm">
              {exploreLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:underline opacity-95 hover:opacity-100">
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
                  <Link href={item.href} className="hover:underline opacity-95 hover:opacity-100">
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
                  <Link href={item.href} className="hover:underline opacity-95 hover:opacity-100">
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

          <div className="flex flex-col items-start sm:items-end lg:items-start">
            <h2 className="mb-4 text-lg font-bold tracking-wide">Connect</h2>
            <div className="mb-4 flex gap-4">
              <Link href="https://www.instagram.com/pinusonline" target="_blank" rel="noopener noreferrer">
                <img src="/ic-instagram-white.svg" alt="Instagram" className="h-10 w-10" />
              </Link>
              <Link
                href="https://www.facebook.com/PerhimpunanIndonesiaNUS"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/ic-facebook-white.svg" alt="Facebook" className="h-10 w-10" />
              </Link>
              <Link
                href="https://www.youtube.com/channel/UCfYU_ttUpJWNEKIbiWoQQHQ"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/ic-youtube-white.svg" alt="YouTube" className="h-10 w-10" />
              </Link>
            </div>
            <a
              href="https://www.pinusstudy.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 text-sm font-medium underline-offset-2 hover:underline"
            >
              PINUS Study
            </a>
            <p className="text-sm text-white/80">© {year} PINUS</p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/20 pt-6 text-center text-xs text-white/70">
          Perhimpunan Indonesia NUS —{" "}
          <Link href="/contact-us" className="hover:underline">
            Get in touch
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
