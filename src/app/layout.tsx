import BackgroundImage from "@/app/background";
import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import React from "react";

import "./globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = { title: "Dailies" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactNode {
  return (
    <html lang="en">
      <body className={`${spaceMono.className} antialiased`}>
        <BackgroundImage src="/images/background.png" />
        <div className="md:m-20">{children}</div>
      </body>
    </html>
  );
}
