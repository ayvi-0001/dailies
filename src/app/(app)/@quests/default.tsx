import * as React from "react";

import { QuestList } from "@/components/daily";
import ExpBar from "@/components/exp/exp-bar";

import Speeddial from "../../speed-dial";

export default function Default(): React.ReactElement {
  return (
    <>
      <div
        className="relative flex h-full w-screen flex-col items-stretch justify-between px-4 select-none"
        id="default-page"
      >
        <div
          className="h-[calc(80vh)] w-full items-center justify-center self-start"
          id="main-content"
        >
          <QuestList title="Quests" />
        </div>
        <div className="flex grow" />
        <div className="h-fit w-full">
          <ExpBar />
        </div>
      </div>
      <React.Suspense>
        <Speeddial />
      </React.Suspense>
    </>
  );
}
