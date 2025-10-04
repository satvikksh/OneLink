"use client";

import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Navigation",
      links: [
        { name: "Home", href: "/" },
        { name: "My Network", href: "/network" },
        { name: "Jobs", href: "/jobs" },
        { name: "Messaging", href: "/chat" },
        { name: "Notifications", href: "/notifications" },
      ],
    },
    {
      title: "Business",
      links: [
        { name: "For Business", href: "/business" },
        { name: "Advertising", href: "/advertising" },
        { name: "Talent Solutions", href: "/talent" },
        { name: "Marketing Solutions", href: "/marketing" },
        { name: "Sales Solutions", href: "/sales" },
      ],
    },
  ];

  const socialLinks = [
    { name: "Twitter", icon: "🐦", href: "https://twitter.com" },
    { name: "Facebook", icon: "📘", href: "https://facebook.com" },
    { name: "Instagram", icon: "📷", href: "https://instagram.com" },
  ];

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    if (href.startsWith("/")) {
      alert(`Navigating to ${href} - This would route to the page in a real application`);
    } else {
      window.open(href, "_blank");
    }
  };

  return (
    <footer className="bg-white-900 text-gray-700"> {/* Changed bg-gray-900 to bg-white-900 */}
      {/* Main Footer Content - Reduced padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> {/* Reduced from py-12 to py-8 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Reduced gap */}
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-3"> {/* Reduced mb-4 to mb-3 */}
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-sm flex items-center justify-center"> {/* Smaller logo */}
                <span className="text-white font-bold text-sm">1L</span> {/* Smaller text */}
              </div>
              <div>
                <span className="text-lg font-bold text-gray-500">OneLink</span> {/* Slightly smaller */}
                <div className="text-green-400 text-xs font-medium">1L+ Professionals</div> {/* Smaller text */}
              </div>
            </div>
            <p className="text-gray-500 text-xs mb-4"> {/* Smaller text and spacing */}
              India's fastest growing professional network with over 1 lakh users.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-3"> {/* Reduced spacing */}
              {socialLinks.map((social) => (
                <button
                  key={social.name}
                  onClick={(e) => handleLinkClick(e, social.href)}
                  className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded" // Smaller padding
                  title={social.name}
                >
                  <span className="text-sm">{social.icon}</span> {/* Smaller icons */}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Links Sections - Only 2 sections now */}
          {footerSections.map((section) => (
            <div key={section.title} className="lg:col-span-1">
              <h3 className="text-base font-semibold text-gray-600"> {/* Smaller heading */}
                {section.title}
              </h3>
              <ul className="space-y-2"> {/* Reduced spacing */}
                {section.links.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className="text-gray-500 hover:text-white text-xs transition-colors hover:underline" // Smaller text
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Quick Links Section */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-semibold text-gray-600">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={(e) => handleLinkClick(e, "/privacy")}
                  className="text-gray-900 hover:text-black text-xs transition-colors hover:underline"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleLinkClick(e, "/terms")}
                  className="text-gray-500 hover:text-white text-xs transition-colors hover:underline"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleLinkClick(e, "/help")}
                  className="text-gray-500 hover:text-white text-xs transition-colors hover:underline"
                >
                  Help Center
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleLinkClick(e, "/careers")}
                  className="text-gray-500 hover:text-white text-xs transition-colors hover:underline"
                >
                  Careers
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* App Download Section - Made more compact */}
        <div className="mt-8 pt-6 border-t border-gray-700"> {/* Reduced spacing */}
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-3 md:mb-0">
              <h4 className="text-base font-semibold text-white mb-1"> {/* Smaller heading */}
                Get the OneLink app
              </h4>
              <p className="text-gray-500 text-xs"> {/* Smaller text */}
                Connect with 1L+ professionals on the go.
              </p>
            </div>
            <div className="flex space-x-3"> {/* Reduced spacing */}
              <button
                onClick={(e) => handleLinkClick(e, "/app-store")}
                className="flex items-center space-x-2 bg-black hover:bg-gray-800 text-white px-3 py-1 rounded-lg border border-gray-600 transition-colors text-xs" // Smaller padding and text
              >
                <span className="text-sm">📱</span> {/* Smaller icon */}
                <div className="text-left">
                  <div className="text-xs text-gray-400">Download on</div>
                  <div className="text-xs font-semibold">App Store</div> {/* Smaller text */}
                </div>
              </button>
              <button
                onClick={(e) => handleLinkClick(e, "/play-store")}
                className="flex items-center space-x-2 bg-black hover:bg-gray-800 text-white px-3 py-1 rounded-lg border border-gray-600 transition-colors text-xs"
              >
                <span className="text-sm">🤖</span>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Get it on</div>
                  <div className="text-xs font-semibold">Google Play</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Reduced height */}
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3"> {/* Reduced from py-4 to py-3 */}
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-xs mb-2 md:mb-0"> {/* Smaller text */}
              © {currentYear} OneLink India. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-xs"> {/* Reduced spacing and text size */}
              <span className="text-gray-400">
                🌐 English
              </span>
              <span className="text-gray-400">
                💰 INR
              </span>
              <div className="flex items-center space-x-1 text-green-400">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div> {/* Smaller dot */}
                <span>1L+ Users</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;