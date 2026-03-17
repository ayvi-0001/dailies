import * as React from "react";

import type { Metadata, ResolvingMetadata } from "next";

import { QuestList } from "@/components/daily";
import DailiesProvider from "@/components/daily/providers/dailies";
import ExpBar from "@/components/exp/exp-bar";
import type { PageProps } from "@/types/props";

import UserProvider from "./providers/user";
import Speeddial from "./speed-dial";

export default async function Page(_: PageProps): Promise<React.ReactElement> {
  return (
    <React.Suspense>
      <UserProvider>
        <div className="fixed flex h-screen w-screen justify-between select-none">
          <Speeddial />
          <DailiesProvider>
            <div
              className="fixed w-full items-center justify-center self-start px-4 pt-12"
              id="main-content"
            >
              <QuestList title="Quests" />
            </div>
            <div className="mr-6 mb-6 ml-20 w-full self-end">
              <ExpBar />
            </div>
          </DailiesProvider>
        </div>
      </UserProvider>
    </React.Suspense>
  );
}

export async function generateMetadata(_1: PageProps, _2: ResolvingMetadata): Promise<Metadata> {
  return {} as Metadata;
}
