"use client";

import { HeroUIProvider } from "@heroui/react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";

import AppMetaProvider from "./app-meta";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<Parameters<ReturnType<typeof useRouter>["push"]>[1]>;
  }
}

export default function Providers({
  children,
}: Readonly<{ children?: React.ReactNode }>): React.ReactNode {
  const router: AppRouterInstance = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <AppMetaProvider>{children}</AppMetaProvider>
    </HeroUIProvider>
  );
}
