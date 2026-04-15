"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildLoginUrl } from "@/lib/login-callback";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "./button";
import { NavDropdown } from "./nav-dropdown";

const RESOURCES_ITEMS = [
  { href: "/guides", label: "Guides" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
];

const PARTICIPATE_ITEMS = [
  { href: "/forms", label: "Forms" },
  { href: "/marketplace", label: "Marketplace" },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const loginHref = buildLoginUrl(pathname);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
  };

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          <div className="flex min-w-0 shrink-0 items-center">
            <Link href="/">
              <div className="flex items-center">
                <img
                  src="/logo-icon-pinus.svg"
                  alt="Logo"
                  className="h-8 cursor-pointer animate-[spin_4500ms_linear_infinite]"
                />
                <img
                  src="/logo-text-pinus.svg"
                  alt="PINUS"
                  className="h-4 ml-2 sm:ml-3 cursor-pointer"
                />
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-2 min-w-0">
            <Link
              href="/committee"
              className="shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-main"
            >
              Committee
            </Link>
            <Link
              href="/events"
              className="shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-main"
            >
              Events
            </Link>
            <NavDropdown label="Resources" items={RESOURCES_ITEMS} />
            <NavDropdown label="Participate" items={PARTICIPATE_ITEMS} />
            <Link
              href="/contact-us"
              className="shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-main"
            >
              Contact
            </Link>
          </nav>

          <div className="hidden lg:flex shrink-0 items-center gap-2 xl:gap-3">
            {loading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-main border-t-transparent" />
            ) : user ? (
              <div className="flex min-w-0 max-w-[min(520px,52vw)] items-center gap-2">
                <span
                  className="hidden min-w-0 xl:inline-flex items-baseline gap-1 text-sm text-gray-600"
                  title={user.name}
                >
                  <span className="shrink-0">Hello,</span>
                  <span className="min-w-[6ch] max-w-[min(18rem,32vw)] shrink truncate font-medium text-gray-800">
                    {user.name}
                  </span>
                </span>
                <Link href="/profile">
                  <Button variant="blue" outline size="sm">
                    Profile
                  </Button>
                </Link>
                {user.isAdmin && (
                  <>
                    <Link href="/admin/dashboard">
                      <Button variant="yellow" size="sm">
                        Admin
                      </Button>
                    </Link>
                    <Link href="/admin/short-links" className="hidden 2xl:inline">
                      <Button variant="black" outline size="sm">
                        Short links
                      </Button>
                    </Link>
                  </>
                )}
                <Button onClick={handleLogout} variant="red" size="sm">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={loginHref}>
                  <Button variant="blue" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="blue" outline size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            className="lg:hidden text-gray-700 focus:outline-none shrink-0"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={toggleMenu}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  menuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>

        <div
          className={`lg:hidden fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ top: "73px" }}
        >
          <div className="flex h-[calc(100vh-73px)] flex-col justify-between overflow-y-auto p-6">
            <nav className="flex flex-col gap-6">
              <Link
                href="/committee"
                className="text-lg text-gray-800 hover:text-blue-main"
                onClick={toggleMenu}
              >
                Committee
              </Link>
              <Link
                href="/events"
                className="text-lg text-gray-800 hover:text-blue-main"
                onClick={toggleMenu}
              >
                Events
              </Link>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Resources
                </p>
                <div className="ml-2 flex flex-col gap-3 border-l-2 border-gray-100 pl-3">
                  {RESOURCES_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-gray-700 hover:text-blue-main"
                      onClick={toggleMenu}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Participate
                </p>
                <div className="ml-2 flex flex-col gap-3 border-l-2 border-gray-100 pl-3">
                  {PARTICIPATE_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-gray-700 hover:text-blue-main"
                      onClick={toggleMenu}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <Link
                href="/contact-us"
                className="text-lg text-gray-800 hover:text-blue-main"
                onClick={toggleMenu}
              >
                Contact
              </Link>
            </nav>

            <div className="mt-8 flex flex-col gap-4 border-t border-gray-100 pt-6">
              {loading ? (
                <div className="flex justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-main border-t-transparent" />
                </div>
              ) : user ? (
                <div className="space-y-4 text-center">
                  <p className="text-gray-600">Hello, {user.name}</p>
                  <Link href="/profile" onClick={toggleMenu}>
                    <Button variant="blue" outline className="w-full">
                      My Profile
                    </Button>
                  </Link>
                  {user.isAdmin && (
                    <>
                      <Link href="/admin/dashboard" onClick={toggleMenu}>
                        <Button variant="yellow" className="w-full">
                          Admin Dashboard
                        </Button>
                      </Link>
                      <Link href="/admin/short-links" onClick={toggleMenu}>
                        <Button variant="black" outline className="w-full">
                          Short links (admin)
                        </Button>
                      </Link>
                    </>
                  )}
                  <Button onClick={handleLogout} variant="red" className="w-full">
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link href={loginHref} onClick={toggleMenu}>
                    <Button variant="blue" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={toggleMenu}>
                    <Button variant="blue" outline className="w-full">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="h-16" />
    </>
  );
};

export default Header;
