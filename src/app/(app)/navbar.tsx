"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from "next/navigation";

export default function App() {
  const router: AppRouterInstance = useRouter();
  const pathname: string = usePathname();
  const searchParams: ReadonlyURLSearchParams = useSearchParams();

  const getNewPath = React.useCallback(
    (newPathname: string): string => `${newPathname}?${searchParams.toString()}`,
    [searchParams],
  );
  const goToRoot = React.useCallback(
    () => router.push(getNewPath("/"), { scroll: false }),
    [router, getNewPath],
  );
  const goToStats = React.useCallback(
    () => router.push(getNewPath("/stats"), { scroll: false }),
    [router, getNewPath],
  );

  return (
    <heroui.Navbar
      isBordered
      className="fixed inset-x-0 bottom-2 flex max-h-15 min-h-15 w-screen self-end border-none bg-transparent"
      classNames={{ content: ["items-center w-full align-center h-full"] }}
      id="navbar"
      isBlurred={false}
      maxWidth="full"
      position="sticky"
    >
      <heroui.NavbarContent className="" id="navbar-content" justify="center">
        <heroui.NavbarItem isActive={pathname === "/" && [...searchParams.keys()].length === 1}>
          <heroui.Link color="foreground" onClick={goToRoot}>
            <span className="text-xs text-white">Quests</span>
          </heroui.Link>
        </heroui.NavbarItem>
        <heroui.NavbarItem isActive={pathname === "/stats"}>
          <heroui.Link aria-current="page" onClick={goToStats}>
            <span className="text-xs text-white">Stats</span>
          </heroui.Link>
        </heroui.NavbarItem>
      </heroui.NavbarContent>
    </heroui.Navbar>
  );
}
