import * as React from "react";

import type { Metadata, Viewport } from "next";
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
  children: React.ReactNode;
}>;

export const viewport: Viewport = {
  width: "device-width",
  height: "device-height",
  initialScale: 1.0,
  maximumScale: 1.0,
  minimumScale: 1.0,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout(pages: Pages): React.ReactNode {
  const { children } = pages;

  return (
    <html suppressHydrationWarning className={`${spaceMono.className} antialiased`} lang="en">
      <head>
        {/* process.env.NODE_ENV === "development" && (
          // Connect to react-devtools server.
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script src="http://localhost:8097"></script>
        ) */}
      </head>
      <body className="touch-none overflow-hidden select-none">
        <Providers>
          <React.Suspense>
            <AppBuildInfo as="header" />
          </React.Suspense>
          <Toaster />
          <div className="fixed z-1 flex h-screen w-screen bg-transparent py-15" id="layout">
            {children}
          </div>
          <BackgroundImage />
        </Providers>
      </body>
    </html>
  );
}
