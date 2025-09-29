// src/components/Navbar.tsx
"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

const Navbar: React.FC = () => {
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center fixed top-0 w-full z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Image src="/logo 1L.png" alt="Logo" width={40} height={40} />
        <span className="text-xl font-bold text-sky-700">OneLink</span>
      </div>

      {/* Navigation */}
      <nav className="space-x-4">
        <Link href="/" className="text-gray-700 hover:text-blue-700">
          Home
        </Link>
        <Link href="/network" className="text-gray-700 hover:text-blue-700">
          My Network
        </Link>
        <Link href="/jobs" className="text-gray-700 hover:text-blue-700">
          Jobs
        </Link>
        <Link href="/message" className="text-gray-700 hover:text-blue-700">
          Messaging
        </Link>
        <Link href="/notification" className="text-gray-700 hover:text-blue-700">
          Notifications
        </Link>
      </nav>
    </header>
  );
};

export default Navbar;
