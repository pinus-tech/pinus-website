"use client";
import React, { useState, useEffect } from 'react';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="logo-pinus.svg" // Replace with your logo path
            alt="Logo"
            className="h-8"
          />          
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-6">
          <a href="#about" className="text-gray-700 hover:text-blue-main">
            About Us
          </a>
          <a href="#guides" className="text-gray-700 hover:text-blue-main">
            Guides
          </a>
          <a href="#committee" className="text-gray-700 hover:text-blue-main">
            Committee
          </a>
          <a href="#events" className="text-gray-700 hover:text-blue-main">
            Events
          </a>
          <a href="#blogs" className="text-gray-700 hover:text-blue-main">
            Blogs
          </a>
          <a href="#contact" className="text-gray-700 hover:text-blue-main">
            Contact Us
          </a>
        </nav>

        {/* Sign In Button */}
        <button className="hidden md:inline-block bg-blue-main text-white py-2 px-4 rounded hover:bg-blue-main">
          Sign In
        </button>

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
        className={`fixed inset-0 bg-white flex flex-col items-center justify-center transform ${
          menuOpen ? 'translate-y-0' : '-translate-y-full'
        } transition-transform duration-300 ease-in-out h-screen`}
      >
        <button
          className="absolute top-4 right-4 text-gray-700 focus:outline-none"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <nav className="flex flex-col space-y-6 text-center">
          <a
            href="#about"
            className="text-gray-700 text-xl hover:text-blue-main"
            onClick={toggleMenu}
          >
            About Us
          </a>
          <a
            href="#guides"
            className="text-gray-700 text-xl hover:text-blue-main"
            onClick={toggleMenu}
          >
            Guides
          </a>
          <a
            href="#committee"
            className="text-gray-700 text-xl hover:text-blue-main"
            onClick={toggleMenu}
          >
            Committee
          </a>
          <a
            href="#events"
            className="text-gray-700 text-xl hover:text-blue-main"
            onClick={toggleMenu}
          >
            Events
          </a>
          <a
            href="#blogs"
            className="text-gray-700 text-xl hover:text-blue-main"
            onClick={toggleMenu}
          >
            Blogs
          </a>
          <a
            href="#contact"
            className="text-gray-700 text-xl hover:text-blue-main"
            onClick={toggleMenu}
          >
            Contact Us
          </a>
        </nav>
        <button
          className="mt-6 bg-blue-main text-white py-2 px-6 rounded hover:bg-blue-700"
          onClick={toggleMenu}
        >
          Sign In
        </button>
      </div>
    </header>
  );
};

export default Header;