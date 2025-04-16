import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-blue-main text-white py-8 px-4">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
        {/* Left Section: Explore */}
        <div>
          <h2 className="text-xl font-bold mb-4">Explore</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/committee" className="hover:underline">
                Committee
              </Link>
            </li>
            <li>
              <Link href="/events" className="hover:underline">
                Event
              </Link>
            </li>
            <li>
              <Link href="/guides" className="hover:underline">
                Guides
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:underline">
                Blog
              </Link>
            </li>
          </ul>
        </div>

        {/* Center Section: Icons */}
        <div className="flex flex-col items-center">
          <div className="flex space-x-4 mb-4">
            {/* Replace these with actual icons or images */}
            <Link href="https://www.instagram.com/pinusonline" target='_blank'>              
              <img src="/ic-instagram-white.svg" alt="Instagram" className="h-10 w-10" />              
            </Link>
            <Link href="https://www.facebook.com/PerhimpunanIndonesiaNUS" target='_blank'>              
              <img src="/ic-facebook-white.svg" alt="Instagram" className="h-10 w-10" />              
            </Link>
            <Link href="https://www.youtube.com/channel/UCfYU_ttUpJWNEKIbiWoQQHQ" target='_blank'>              
              <img src="/ic-youtube-white.svg" alt="Instagram" className="h-10 w-10" />              
            </Link>
          </div>
          <a href="#contact" className="hover:underline">
            Contact Us
          </a>
        </div>

        {/* Right Section: Copyright */}
        <div className="text-center md:text-right">
          <p>© {(new Date().getFullYear())} PINUS</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;