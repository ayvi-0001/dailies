import * as React from "react";

import type { Metadata, ResolvingMetadata } from "next";

import NavBar from "@/app/navbar";
import { QuestList } from "@/components/daily";
import DailiesProvider from "@/components/daily/providers/dailies";
import ExpBar from "@/components/exp/exp-bar";
import type { PageProps } from "@/types/props";

import UserProvider from "./providers/user";
import Speeddial from "./speed-dial";

export default async function Page(_: PageProps): Promise<React.ReactElement> {
  return (
    <>
      <React.Suspense>
        <UserProvider>
          <DailiesProvider>
            <div
              className="relative flex h-full w-screen flex-col items-stretch justify-between select-none"
              id="default-page"
            >
              <div
                className="h-[calc(80vh)] w-full items-center justify-center self-start px-4"
                id="main-content"
              >
                <QuestList title="Quests" />
              </div>
              <div className="flex grow"></div>
              <div className="h-fit w-full">
                <ExpBar />
              </div>
            </div>
          </DailiesProvider>
        </UserProvider>
      </React.Suspense>
      <React.Suspense>
        <Speeddial />
        <NavBar />
      </React.Suspense>
    </>
  );
}

export async function generateMetadata(_1: PageProps, _2: ResolvingMetadata): Promise<Metadata> {
  return {} as Metadata;
}
