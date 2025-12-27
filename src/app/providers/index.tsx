"use client";

import { HeroUIProvider } from "@heroui/react";
import UserProvider from "./user";

export default function Providers({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactNode {
  return (
    <HeroUIProvider>
        <UserProvider>{children}</UserProvider>
    </HeroUIProvider>
  );
}
