"use client";

import { HeroUIProvider } from "@heroui/react";
import AppMetaProvider from "./app-meta";
import UserProvider from "./user";

export default function Providers({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactNode {
  return (
    <HeroUIProvider>
      <AppMetaProvider>
        <UserProvider>{children}</UserProvider>
      </AppMetaProvider>
    </HeroUIProvider>
  );
}
