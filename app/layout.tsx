// src/app/layout.tsx
import "./globals.css";
import React, { ReactNode } from "react";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "OneLink",
  description: "Next.js OneLink Application",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <div className="fixed top-0 left-0 right-0 z-50">
          {/* <Navbar /> */}
        </div>

        {/* Main wrapper with padding-top for fixed navbar */}
       <main className="max-w-6xl mx-auto px-4 !pt-0">

          {children}
        </main>
      </body>
    </html>
  );
}
