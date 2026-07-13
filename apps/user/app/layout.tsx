import type { Metadata } from "next";
import "./globals.css";
import "../../../design-system.css";

export const metadata: Metadata = {
  title: "C-Brain",
  description: "C-Brain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
