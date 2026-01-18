"use client";

import * as React from "react";

import { ScrollShadow } from "@heroui/react";

import { User, UserState, useState as useUserState } from "@/app/providers/user";
import { invoke } from "@/lib/tauri";
import { Option } from "@/types/option";

import { DailiesState, useDailies } from "./providers/dailies";
import { QuestChain, QuestsHeader } from "./quest-chain";
import { Daily, Quest } from "./types";

export default function QuestList({ title }: { title: string }): React.ReactNode {
  const userState: UserState = useUserState();
  const dailiesState: DailiesState = useDailies();

  const {
    isArchivedQuestsFiltered,
    isCompletedQuestsFiltered,
    isOptionalQuestsFiltered,
    setArchivedQuestsFilteredAction,
    setCompletedQuestsFilteredAction,
    setOptionalQuestsFilteredAction,
    isDailyFilteredAction,
  } = useQuestListConfig(userState.user);

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
        <QuestsHeader
          isArchivedQuestsFiltered={isArchivedQuestsFiltered}
          isCompletedQuestsFiltered={isCompletedQuestsFiltered}
          isOptionalQuestsFiltered={isOptionalQuestsFiltered}
          setArchivedQuestsFilteredAction={setArchivedQuestsFilteredAction}
          setCompletedQuestsFilteredAction={setCompletedQuestsFilteredAction}
          setOptionalQuestsFilteredAction={setOptionalQuestsFilteredAction}
          title={title}
        />
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
            dailies={groupedDailies[chain] ?? []}
            isDailyFilteredAction={isDailyFilteredAction}
            setDailiesAction={dailiesState.setDailies}
            totalWeight={dailiesState.totalWeight}
            user={userState.user}
            onUpdateAction={dailiesState.triggerRefreshDailies}
          />
        ))}
      </ScrollShadow>
    </div>
  );
}

function useQuestListConfig(user: User): {
  isArchivedQuestsFiltered: boolean;
  isCompletedQuestsFiltered: boolean;
  isOptionalQuestsFiltered: boolean;
  setArchivedQuestsFilteredAction: (value: boolean) => Promise<void>;
  setCompletedQuestsFilteredAction: (value: boolean) => Promise<void>;
  setOptionalQuestsFilteredAction: (value: boolean) => Promise<void>;
  isDailyFilteredAction: (daily: Daily) => Option<Daily>;
} {
  const [isArchivedQuestsFiltered, setArchivedQuestsFiltered] = React.useState(false);
  const [isCompletedQuestsFiltered, setCompletedQuestsFiltered] = React.useState(false);
  const [isOptionalQuestsFiltered, setOptionalQuestsFiltered] = React.useState(false);

  React.useEffect(() => {
    const get_config_is_archived_quests_filtered = async () => {
      await invoke<boolean>("get_key_as_bool", {
        user_id: user.id,
        key: "quest-list--is-archived-quests-filtered",
      }).then(result => setArchivedQuestsFiltered(result || false));
    };
    get_config_is_archived_quests_filtered();
  }, [user.id]);

  React.useEffect(() => {
    const get_config_is_completed_quests_filtered = async () => {
      await invoke<boolean>("get_key_as_bool", {
        user_id: user.id,
        key: "quest-list--is-completed-quests-filtered",
      }).then(result => setCompletedQuestsFiltered(result || false));
    };
    get_config_is_completed_quests_filtered();
  }, [user.id]);

  React.useEffect(() => {
    const get_config_is_optional_quests_filtered = async () => {
      await invoke<boolean>("get_key_as_bool", {
        user_id: user.id,
        key: "quest-list--is-optional-quests-filtered",
      }).then(result => setOptionalQuestsFiltered(result || false));
    };
    get_config_is_optional_quests_filtered();
  }, [user.id]);

  const setArchivedQuestsFilteredAction = async (value: boolean): Promise<void> => {
    setArchivedQuestsFiltered(value);
    await invoke<boolean>("set_key_as_bool", {
      user_id: user.id,
      key: "quest-list--is-archived-quests-filtered",
      value: value,
    });
  };

  const setCompletedQuestsFilteredAction = async (value: boolean): Promise<void> => {
    setCompletedQuestsFiltered(value);
    await invoke<boolean>("set_key_as_bool", {
      user_id: user.id,
      key: "quest-list--is-completed-quests-filtered",
      value: value,
    });
  };

  const setOptionalQuestsFilteredAction = async (value: boolean): Promise<void> => {
    setOptionalQuestsFiltered(value);
    await invoke<boolean>("set_key_as_bool", {
      user_id: user.id,
      key: "quest-list--is-optional-quests-filtered",
      value: value,
    });
  };

  const isDailyFilteredAction = (daily: Daily): Option<Daily> => {
    if (isArchivedQuestsFiltered && !!daily.archived) {
      return null;
    } else if (isCompletedQuestsFiltered && daily.complete == 1) {
      return null;
    } else if (isOptionalQuestsFiltered && daily.type == `${Quest.Type.QO}`) {
      return null;
    } else {
      return daily;
    }
  };

  return {
    isArchivedQuestsFiltered,
    isCompletedQuestsFiltered,
    isOptionalQuestsFiltered,
    setArchivedQuestsFilteredAction,
    setCompletedQuestsFilteredAction,
    setOptionalQuestsFilteredAction,
    isDailyFilteredAction,
  };
}
