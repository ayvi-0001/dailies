import * as React from "react";

import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";

import AppBuildInfo from "@/components/header/build-info";

import "./globals.css";

import BackgroundImage from "./background";
import Toaster from "./listener";
import Providers from "./providers";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
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
        {/* process.env.NODE_ENV === "development" && (
          // Connect to react-devtools server.
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script src="http://localhost:8097"></script>
        ) */}
        <meta
          content="width=device-width, height=device-height, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content"
          name="viewport"
        />
      </head>
      <body className="touch-none overflow-hidden select-none">
        <Providers>
          <AppBuildInfo as="header" />
          <Toaster />
          <div className="fixed z-1 flex h-screen w-screen bg-transparent py-15" id="layout">
            {modals}
            {children}
          </div>
          <BackgroundImage src="/images/background.png" />
        </Providers>
      </body>
    </html>
  );
}
