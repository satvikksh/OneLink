"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/network", label: "My Network" },
    { path: "/jobs", label: "Jobs" },
    { path: "/chat", label: "Messaging" },   // ✅ Messaging → Chat page
    { path: "/notification", label: "Notifications" },
  ];

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center fixed top-0 w-full z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="Logo" width={40} height={40} />
        <span className="text-xl font-bold text-sky-700">OneLink</span>
      </div>

      {/* Navigation */}
      <nav className="space-x-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`${
              pathname === item.path
                ? "text-blue-700 font-semibold"
                : "text-gray-700"
            } hover:text-blue-700`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Navbar;
