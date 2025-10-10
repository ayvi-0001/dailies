import React from "react";

import BackgroundImage from "@/app/background";
import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";

import CommandDialog from "@/components/command-dialog";

import "./globals.css";
import WindowSizeProvider from "./providers/window-size";

// export const experimental_ppr = true;

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
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV !== "production" ? (
          // Connect to react-devtools server.
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script src="http://localhost:8097"></script>
        ) : undefined}
      </head>
      <body className={`${spaceMono.className} antialiased`}>
        <BackgroundImage src="/images/background.png" />
        <CommandDialog />
        <WindowSizeProvider>
          <div className="sm:m-5 lg:m-20">{children}</div>
        </WindowSizeProvider>
      </body>
    </html>
  );
}
