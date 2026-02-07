"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from './button';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center">
              <img
                  src="/logo-icon-pinus.svg" 
                  alt="Logo"
                  className="h-8 cursor-pointer animate-[spin_4500ms_linear_infinite]"
                />
                <img
                  src="/logo-text-pinus.svg" 
                  alt="Logo"
                  className="h-4 ml-3 cursor-pointer"
                />
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-700 hover:text-blue-main">
              About Us
            </Link>
            <Link href="/guides" className="text-gray-700 hover:text-blue-main">
              Guides
            </Link>
            <Link href="/committee" className="text-gray-700 hover:text-blue-main">
              Committee
            </Link>
            <Link href="/events" className="text-gray-700 hover:text-blue-main">
              Events
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-blue-main">
              Blogs
            </Link>
            <Link href="/faq" className="text-gray-700 hover:text-blue-main">
              FAQ
            </Link>
            <Link href="/contact-us" className="text-gray-700 hover:text-blue-main">
              Contact Us
            </Link>
            <Link href="https://www.pinusstudy.com/" target="_blank" className="pinus-study-button">
              PINUS Study
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {loading ? (
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-main border-t-transparent"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Hello, {user.name}</span>
                <Link href="/profile">
                  <Button variant="blue" outline size="sm">
                    Profile
                  </Button>
                </Link>
                {user.isAdmin && (
                  <Link href="/admin/dashboard">
                    <Button variant="yellow" size="sm">
                      Admin Dashboard
                    </Button>
                  </Link>
                )}
                <Button onClick={handleLogout} variant="red" size="sm">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
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

          {/* Hamburger Menu Button */}
          <button
            className="md:hidden text-gray-700 focus:outline-none"
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
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ top: '80px' }}
        >
          <div className="flex flex-col h-full justify-between p-6">
            <nav className="flex flex-col space-y-6 text-center">
              <Link href="/" className="text-gray-700 text-xl hover:text-blue-main" onClick={toggleMenu}>
                About Us
              </Link>
              <Link href="/guides" className="text-gray-700 text-xl hover:text-blue-main" onClick={toggleMenu}>
                Guides
              </Link>
              <Link href="/committee" className="text-gray-700 text-xl hover:text-blue-main" onClick={toggleMenu}>
                Committee
              </Link>
              <Link href="/events" className="text-gray-700 text-xl hover:text-blue-main" onClick={toggleMenu}>
                Events
              </Link>
              <Link href="/blog" className="text-gray-700 text-xl hover:text-blue-main" onClick={toggleMenu}>
                Blogs
              </Link>
              <Link href="/faq" className="text-gray-700 text-xl hover:text-blue-main" onClick={toggleMenu}>
                FAQ
              </Link>
              <Link href="/contact-us" className="text-gray-700 text-xl hover:text-blue-main" onClick={toggleMenu}>
                Contact Us
              </Link>
              <Link href="https://www.pinusstudy.com/" target="_blank" className="pinus-study-button" onClick={toggleMenu}>
                PINUS Study
              </Link>
            </nav>
            
            {/* Mobile Auth Section */}
            <div className="flex flex-col space-y-4 mt-6">
              {loading ? (
                <div className="flex justify-center">
                  <div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-main border-t-transparent"></div>
                </div>
              ) : user ? (
                <div className="text-center space-y-4">
                  <p className="text-gray-600">Hello, {user.name}</p>
                  <Link href="/profile" onClick={toggleMenu}>
                    <Button variant="blue" outline className="w-full">
                      My Profile
                    </Button>
                  </Link>
                  {user.isAdmin && (
                    <Link href="/admin/dashboard" onClick={toggleMenu}>
                      <Button variant="yellow" className="w-full">
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button onClick={handleLogout} variant="red" className="w-full">
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link href="/login" onClick={toggleMenu}>
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
      {/* Offset for sticky header */}
      <div className="h-16"></div>
    </>
  );
};

export default Header;