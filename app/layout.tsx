import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arsa — A quiet AI that pays attention to your life",
  description:
    "Arsa reads your inbox and calendar, sees what you are carrying, and gives you back a clear picture of your life. Built for everyone, in Johannesburg.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
