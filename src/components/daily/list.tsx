"use client";

import * as React from "react";

import { ScrollShadow } from "@heroui/react";

import * as User from "@/app/providers/user";
import { Option } from "@/types/option";

import { DailiesState, useDailies } from "./providers/dailies";
import { QuestChain, QuestsHeader } from "./quest-chain";
import { Daily } from "./types";

export default function QuestList({ title }: { title: string }): React.ReactNode {
  const userState: User.UserState = User.useState();
  const dailiesState: DailiesState = useDailies();

  const groupedDailies = dailiesState.dailies.reduce(
    (accumulator, currentItem) => {
      const category = currentItem.chain;
      if (!accumulator[category]) {
        accumulator[category] = [];
      }
      accumulator[category].push(currentItem);
      return accumulator;
    },
    {} as Record<string, Option<Daily[]>>,
  );

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-hidden" id="dailies-list">
      <div className="mx-2">
        <QuestsHeader title={title} />
      </div>
      <ScrollShadow
        hideScrollBar
        className="h-[calc(100vh-20vh)]"
        offset={40}
        orientation="vertical"
        size={40}
        visibility="auto"
      >
        {dailiesState.questChains?.map((chain, idx) => (
          <QuestChain
            key={idx}
            chain={chain}
            dailies={groupedDailies[chain] || []}
            setDailiesAction={dailiesState.setDailies}
            totalWeight={dailiesState.totalWeight}
            user={userState.user!}
            onUpdateAction={dailiesState.triggerRefreshDailies}
          />
        ))}
      </ScrollShadow>
    </div>
  );
}
