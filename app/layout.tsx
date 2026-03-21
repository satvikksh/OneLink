import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "OneLink Education Hub",
  description:
    "Dual-module discovery platform connecting students with schools and colleges.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
