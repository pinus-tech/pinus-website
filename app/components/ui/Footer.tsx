import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-blue-main text-white py-8 px-4">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
        {/* Left Section: Explore */}
        <div>
          <h2 className="text-xl font-bold mb-4">Explore</h2>
          <ul className="space-y-2">
            <li>
              <a href="#committee" className="hover:underline">
                Committee
              </a>
            </li>
            <li>
              <a href="#events" className="hover:underline">
                Event
              </a>
            </li>
            <li>
              <a href="#guides" className="hover:underline">
                Guides
              </a>
            </li>
            <li>
              <a href="#blogs" className="hover:underline">
                Blog
              </a>
            </li>
          </ul>
        </div>

        {/* Center Section: Icons */}
        <div className="flex flex-col items-center">
          <div className="flex space-x-4 mb-4">
            {/* Replace these with actual icons or images */}
            <div className="h-10 w-10 bg-gray-300"></div>
            <div className="h-10 w-10 bg-gray-300"></div>
            <div className="h-10 w-10 bg-gray-300"></div>
          </div>
          <a href="#contact" className="hover:underline">
            Contact Us
          </a>
        </div>

        {/* Right Section: Copyright */}
        <div className="text-center md:text-right">
          <p>© 2024 PINUS</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;