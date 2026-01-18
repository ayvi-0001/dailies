import * as React from "react";

import type { Metadata, ResolvingMetadata } from "next";

import { QuestList } from "@/components/daily";
import DailiesProvider from "@/components/daily/providers/dailies";
import ExpBar from "@/components/exp/exp-bar";
import type { PageProps } from "@/types/props";

import Speeddial from "./speed-dial";

export default async function Page(_: PageProps): Promise<React.ReactElement> {
  return (
    <React.Suspense>
      <div className="fixed flex h-screen w-screen justify-between select-none">
        <Speeddial />
        <DailiesProvider>
          <div
            className="fixed w-full items-center justify-center self-start pt-15 pr-4 pl-4"
            id="main-content"
          >
            <QuestList title="Quests" />
          </div>
          <div className="mr-7 mb-4 ml-20 w-full self-end">
           <ExpBar />
          </div>
        </DailiesProvider>
      </div>
    </React.Suspense>
  );
}

export async function generateMetadata(_1: PageProps, _2: ResolvingMetadata): Promise<Metadata> {
  return {} as Metadata;
}
