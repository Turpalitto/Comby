import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COMBI Builder",
  description: "Local AI builder shell for websites, apps, and browser games."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

