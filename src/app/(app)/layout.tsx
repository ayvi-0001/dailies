"use client";

import * as React from "react";

import { usePathname } from "next/navigation";

import UserProvider from "@/app/providers/user";
import DailiesProvider from "@/components/daily/providers/dailies";

import NavBar from "../navbar";

type AppLayoutProps = Readonly<{
  children: React.ReactNode;
  modals: React.ReactNode;
  quests: React.ReactNode;
  stats: React.ReactNode;
}>;

export default function AppLayout(props: AppLayoutProps): React.ReactElement {
  const { children, modals, quests, stats } = props;
  const pathname: string = usePathname();
  const tab: "quests" | "stats" = pathname === "/stats" ? "stats" : "quests";

  return (
    <React.Suspense>
      <UserProvider>
        <DailiesProvider>
          <div className={tab === "quests" ? "contents" : "hidden"}>{quests}</div>
          <div className={tab === "stats" ? "contents" : "hidden"}>{stats}</div>
          {modals}
          <React.Suspense>{children}</React.Suspense>
          <React.Suspense>
            <NavBar />
          </React.Suspense>
        </DailiesProvider>
      </UserProvider>
    </React.Suspense>
  );
}
