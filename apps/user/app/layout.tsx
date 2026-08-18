import { createRootMetadata } from "./_content/seo";
import "./globals.css";
import "@repo/content/rich-content.css";
import "../../../design-system.css";

export const metadata = createRootMetadata();

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
