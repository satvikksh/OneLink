// src/app/layout.tsx
import "./globals.css";
import React, { ReactNode } from "react";
import Navbar from "./Navbar";

export const metadata = {
  title: "OneLink",
  description: "Next.js OneLink Application",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="pt-20 bg-gray-100">
        {/* Navbar is constant on all pages */}
        <Navbar />
        <main className="max-w-6xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
