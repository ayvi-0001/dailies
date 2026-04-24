"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import { ReadonlyURLSearchParams, usePathname, useSearchParams } from "next/navigation";

export default function App() {
  const pathname: string = usePathname();
  const searchParams: ReadonlyURLSearchParams = useSearchParams();

  const getNewPath = React.useCallback(
    (newPathname: string): string => `${newPathname}?${searchParams.toString()}`,
    [searchParams],
  );

  return (
    <heroui.Navbar
      isBordered
      className="fixed inset-x-0 bottom-2 flex max-h-15 min-h-15 w-screen self-end bg-transparent"
      classNames={{
        item: [
          "flex relative items-center",
          "data-[active=true]:after:content-['']",
          "data-[active=true]:after:absolute",
          "data-[active=true]:after:bottom-0",
          "data-[active=true]:after:left-0",
          "data-[active=true]:after:right-0",
          "data-[active=true]:after:h-[2px]",
          "data-[active=true]:after:rounded-[2px]",
          "data-[active=true]:after:bg-primary",
        ],
        content: ["items-center w-full align-center h-full"],
      }}
      id="navbar"
      isBlurred={false}
      maxWidth="full"
      position="sticky"
    >
      <heroui.NavbarContent className="" id="navbar-content" justify="center">
        <heroui.NavbarItem isActive={pathname === "/" && [...searchParams.keys()].length === 1}>
          <heroui.Link color="foreground" href={getNewPath("/")}>
            <span className="text-xs text-white">Quests</span>
          </heroui.Link>
        </heroui.NavbarItem>
        <heroui.NavbarItem isActive={pathname === "/stats"}>
          <heroui.Link aria-current="page" href={getNewPath("/stats")}>
            <span className="text-xs text-white">Stats</span>
          </heroui.Link>
        </heroui.NavbarItem>
      </heroui.NavbarContent>
    </heroui.Navbar>
  );
}
