"use client";

import { HeroUIProvider } from "@heroui/react";

import WindowSizeProvider from "./window-size";

export default function Providers({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactNode {
  return (
    <HeroUIProvider>
      <WindowSizeProvider>{children}</WindowSizeProvider>
    </HeroUIProvider>
  );
}
