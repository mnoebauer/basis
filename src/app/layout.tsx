import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Basis",
  description: "Basis is a calmer hiring workspace for publishing roles, reviewing candidates, and making decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body>{children}</body>
    </html>
  );
}
