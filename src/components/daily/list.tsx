"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";
import { Result } from "neverthrow";

import { User, useUser } from "@/app/providers/user";
import { invoke } from "@/lib/tauri";
import { Option } from "@/types/option";

import { DailiesState, useDailies } from "./providers/dailies";
import QuestChain, { QuestsHeader } from "./quest-chain";
import { Daily, Quest } from "./types";

export default function QuestList({ title }: { title: string }): React.ReactElement {
  const user: Result<User, Error> = useUser({ fallbackPath: "/login" });

  return user.match(
    (t) => { return <UserQuestList title={title} user={t} />; },
    (_) => <></>,
  );
}

export function UserQuestList({ title, user }: { title: string; user: User }): React.ReactElement {
  const dailiesState: DailiesState = useDailies();

  const [minutelyRefresh, setMinutelyRefresh] = React.useState<Date>(new Date());
  React.useEffect(() => {
    const now = new Date();
    const secondsUntilNextMinute = 60 - now.getSeconds();
    const millisecondsUntilNextMinute = secondsUntilNextMinute * 1000;

    const initialTimeoutId = setTimeout(() => {
      setMinutelyRefresh(new Date());
      const intervalId = setInterval(() => setMinutelyRefresh(new Date()), 60 * 1000);
      return () => clearInterval(intervalId);
    }, millisecondsUntilNextMinute);

    return () => clearTimeout(initialTimeoutId);
  }, []);

  const {
    isAllQuestChainsCollapsed,
    isArchivedQuestsFiltered,
    isCompletedQuestsFiltered,
    isDailyFilteredAction,
    isOptionalQuestsFiltered,
    questNameFilterText,
    setArchivedQuestsFilteredAction,
    setCompletedQuestsFilteredAction,
    setIsAllQuestChainCollapsedAction,
    setOptionalQuestsFilteredAction,
    setQuestNameFilterTextAction,
  } = useQuestListConfig(user);

  const groupedDailies: Record<string, Option<Daily[]>> = React.useMemo(
    () =>
      dailiesState.dailies.reduce(
        (accumulator: Record<string, Option<Daily[]>>, currentItem: Daily) => {
          const category = currentItem.chain;
          if (!accumulator[category]) {
            accumulator[category] = [];
          }
          accumulator[category].push(currentItem);
          return accumulator;
        },
        {},
      ),
    [dailiesState.dailies],
  );

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-hidden" id="dailies-list">
      <QuestsHeader
        isAllQuestChainsCollapsed={isAllQuestChainsCollapsed}
        isArchivedQuestsFiltered={isArchivedQuestsFiltered}
        isCompletedQuestsFiltered={isCompletedQuestsFiltered}
        isOptionalQuestsFiltered={isOptionalQuestsFiltered}
        listDate={dailiesState.date}
        questNameFilterText={questNameFilterText}
        setArchivedQuestsFilteredAction={setArchivedQuestsFilteredAction}
        setCompletedQuestsFilteredAction={setCompletedQuestsFilteredAction}
        setIsAllQuestChainCollapsedAction={setIsAllQuestChainCollapsedAction}
        setListDateAction={dailiesState.setDate}
        setOptionalQuestsFilteredAction={setOptionalQuestsFilteredAction}
        setQuestNameFilterTextAction={setQuestNameFilterTextAction}
        title={title}
      />
      {dailiesState.isLoading ? (
        <div className="flex size-full cursor-wait place-items-center opacity-40">
          <heroui.Skeleton className="dark rounded-medium mx-2 mt-3 size-full" />
        </div>
      ) : (
        <heroui.ScrollShadow
          hideScrollBar
          className="h-[calc(100vh-20vh)]"
          offset={40}
          orientation="vertical"
          size={40}
          visibility="auto"
        >
          {dailiesState.questChains?.map((value, idx) => (
            <QuestChain
              key={idx}
              chain={value.chain}
              dailies={groupedDailies[value.chain] ?? []}
              isAllQuestChainsCollapsed={isAllQuestChainsCollapsed}
              isDailyFilteredAction={isDailyFilteredAction}
              minutelyRefresh={minutelyRefresh}
              setDailiesAction={dailiesState.setDailies}
              totalWeight={dailiesState.totalWeight}
              updateDaily={dailiesState.updateDaily}
              user={user}
            />
          ))}
        </heroui.ScrollShadow>
      )}
    </div>
  );
}

function useQuestListConfig(user: User): {
  isAllQuestChainsCollapsed: boolean;
  isArchivedQuestsFiltered: boolean;
  isCompletedQuestsFiltered: boolean;
  isDailyFilteredAction: (daily: Daily) => Option<Daily>;
  isOptionalQuestsFiltered: boolean;
  questNameFilterText: string;
  setArchivedQuestsFilteredAction: (value: boolean) => Promise<void>;
  setCompletedQuestsFilteredAction: (value: boolean) => Promise<void>;
  setIsAllQuestChainCollapsedAction: (value: boolean) => Promise<void>;
  setOptionalQuestsFilteredAction: (value: boolean) => Promise<void>;
  setQuestNameFilterTextAction: (value: string) => Promise<void>;
} {
  const [isArchivedQuestsFiltered, setArchivedQuestsFiltered] = React.useState(false);
  const [isCompletedQuestsFiltered, setCompletedQuestsFiltered] = React.useState(false);
  const [isOptionalQuestsFiltered, setOptionalQuestsFiltered] = React.useState(false);
  const [isAllQuestChainsCollapsed, setIsAllQuestChainCollapsed] = React.useState(false);
  const [questNameFilterText, setQuestNameFilterText] = React.useState("");

  ReactUse.useOnceEffect(() => {
    const get_config_is_archived_quests_filtered = async () => {
      await invoke<boolean>("get_key_as_bool", {
        user_id: user.id,
        key: "quest-list--is-archived-quests-filtered",
      })
        .then((result) => setArchivedQuestsFiltered(result || false))
        .catch(console.error);
    };
    const get_config_is_completed_quests_filtered = async () => {
      await invoke<boolean>("get_key_as_bool", {
        user_id: user.id,
        key: "quest-list--is-completed-quests-filtered",
      })
        .then((result) => setCompletedQuestsFiltered(result || false))
        .catch(console.error);
    };
    const get_config_is_optional_quests_filtered = async () => {
      await invoke<boolean>("get_key_as_bool", {
        user_id: user.id,
        key: "quest-list--is-optional-quests-filtered",
      })
        .then((result) => setOptionalQuestsFiltered(result || false))
        .catch(console.error);
    };
    const get_config_is_quest_chains_collapsed = async () => {
      await invoke<boolean>("get_key_as_bool", {
        user_id: user.id,
        key: "quest-list--is-quest-chains-collapsed",
      })
        .then((result) => setIsAllQuestChainCollapsed(result || false))
        .catch(console.error);
    };

    get_config_is_archived_quests_filtered();
    get_config_is_completed_quests_filtered();
    get_config_is_optional_quests_filtered();
    get_config_is_quest_chains_collapsed();
  }, [user]);

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

  const setIsAllQuestChainCollapsedAction = async (value: boolean): Promise<void> => {
    setIsAllQuestChainCollapsed(value);
    await invoke<boolean>("set_key_as_bool", {
      user_id: user.id,
      key: "quest-list--is-quest-chains-collapsed",
      value: value,
    });
  };

  const setQuestNameFilterTextAction = async (value: string): Promise<void> =>
    setQuestNameFilterText(value);

  const isDailyFilteredAction = React.useCallback(
    (daily: Daily): Option<Daily> => {
      if (questNameFilterText)
        if (daily.name.includes(questNameFilterText)) return daily;
        else return null;

      if (isArchivedQuestsFiltered && !!daily.archived) {
        return null;
      } else if (isCompletedQuestsFiltered && daily.complete == 1) {
        return null;
      } else if (isOptionalQuestsFiltered && daily.type == `${Quest.Type.QO}`) {
        return null;
      } else {
        return daily;
      }
    },
    [
      isArchivedQuestsFiltered,
      isCompletedQuestsFiltered,
      isOptionalQuestsFiltered,
      questNameFilterText,
    ],
  );

  return {
    isAllQuestChainsCollapsed,
    isArchivedQuestsFiltered,
    isCompletedQuestsFiltered,
    isDailyFilteredAction,
    isOptionalQuestsFiltered,
    questNameFilterText,
    setArchivedQuestsFilteredAction,
    setCompletedQuestsFilteredAction,
    setIsAllQuestChainCollapsedAction,
    setOptionalQuestsFilteredAction,
    setQuestNameFilterTextAction,
  };
}
