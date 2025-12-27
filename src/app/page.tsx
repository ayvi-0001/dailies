import * as React from "react";

import type { Metadata, ResolvingMetadata } from "next";

import { QuestList } from "@/components/daily";
import DailiesProvider from "@/components/daily/context";
import type { PageProps } from "@/types/props";

export default async function Page(_: PageProps): Promise<React.ReactElement> {
  return (
    <DailiesProvider>
      <React.Suspense>
        <div className="fixed flex h-screen w-screen justify-between select-none">
          <div
            className="fixed w-full items-center justify-center self-start pt-15 pr-4 pl-4"
            id="main-content"
          >
            <QuestList title="Quests" />
          </div>
        </div>
      </React.Suspense>
    </DailiesProvider>
  );
}

export async function generateMetadata(_1: PageProps, _2: ResolvingMetadata): Promise<Metadata> {
  return {} as Metadata;
}
