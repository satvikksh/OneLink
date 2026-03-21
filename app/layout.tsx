import "./globals.css";
import type { ReactNode } from "react";
import AppNavbar from "./components/navigation/AppNavbar";
import { themeBootScript } from "./src/lib/theme";

export const metadata = {
  title: "OneLink Education Hub",
  description:
    "Dual-module discovery platform connecting students with schools and colleges.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <AppNavbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
