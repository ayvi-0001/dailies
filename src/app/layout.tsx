import * as React from "react";

import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";

import AppBuildFooter from "@/components/app-build-footer";
import CommandDialog from "@/components/command-dialog";

import "./globals.css";

import BackgroundImage from "./background";
import Toaster from "./listener";
import Providers from "./providers";

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
        <Toaster />
        <CommandDialog />
        <Providers>{children}</Providers>
        <AppBuildFooter />
        <BackgroundImage src="/images/background.png" />
      </body>
    </html>
  );
}
