import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GetMentor — Book 1-on-1 sessions with experts",
  description:
    "Discover vetted mentors, request a time, pay securely, and meet over video.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-background text-foreground antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <div className="flex min-h-screen flex-1 flex-col bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
