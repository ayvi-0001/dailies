import * as React from "react";

import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";

import CommandDialog from "@/components/command-dialog";

import "./globals.css";

import BackgroundImage from "./background";
import AppBuildInfo from "./build-info";
import Toaster from "./listener";
import Providers from "./providers";

// export const experimental_ppr = true;

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = { title: "Dailies" };

type Pages = Readonly<{
  modals: React.ReactNode;
  children: React.ReactNode;
}>;

export default function RootLayout(pages: Pages): React.ReactNode {
  const { modals, children } = pages;

  return (
    <html suppressHydrationWarning className={`${spaceMono.className} antialiased`} lang="en">
      <head>
        {process.env.NODE_ENV === "development" && (
          // Connect to react-devtools server.
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script src="http://localhost:8097"></script>
        )}
      </head>
      <body>
        <Toaster />
        <div className="relative z-1 select-none">
          <Providers>
            {modals}
            {children}
          </Providers>
        </div>
        <AppBuildInfo as="header" />
        <BackgroundImage src="/images/background.png" />
      </body>
    </html>
  );
}
