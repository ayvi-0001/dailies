"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";
import { ScrollShadow } from "@heroui/react";
import { CalendarDate, today } from "@internationalized/date";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation";

import { User, UserState, useState as useUserState } from "@/app/providers/user";
import { LOCAL_TZ } from "@/lib/dates";
import { invoke } from "@/lib/tauri";
import { Option } from "@/types/option";

import { DailiesState, useDailies } from "./providers/dailies";
import { QuestChain, QuestsHeader } from "./quest-chain";
import { Daily, Quest } from "./types";

export default function QuestList({ title }: { title: string }): React.ReactElement {
  const userState: UserState = useUserState();
  const dailiesState: DailiesState = useDailies();

  const [listDate, setListDate] = React.useState<CalendarDate>(today(LOCAL_TZ));

  const router: AppRouterInstance = useRouter();

  const searchParams: ReadonlyURLSearchParams = useSearchParams();
  const createQueryString = React.useCallback(
    (values: Array<{ key: string; value: string }>): string => {
      const params = new URLSearchParams(searchParams);
      for (const { key, value } of values) {
        params.set(key, value);
      }
      return params.toString();
    },
    [searchParams],
  );

  const updateParam = React.useCallback((values: Array<{ key: string; value: string }>): void => {
    router.push(`?${createQueryString(values)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  ReactUse.useOnceEffect(() => {
    updateParam([{ key: "date", value: listDate.toString() }]);
  }, [listDate]);

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
  } = useQuestListConfig(userState.user);

  const groupedDailies: Record<string, Option<Daily[]>> = dailiesState.dailies.reduce(
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
          isAllQuestChainsCollapsed={isAllQuestChainsCollapsed}
          isArchivedQuestsFiltered={isArchivedQuestsFiltered}
          isCompletedQuestsFiltered={isCompletedQuestsFiltered}
          isOptionalQuestsFiltered={isOptionalQuestsFiltered}
          listDate={listDate}
          questNameFilterText={questNameFilterText}
          setArchivedQuestsFilteredAction={setArchivedQuestsFilteredAction}
          setCompletedQuestsFilteredAction={setCompletedQuestsFilteredAction}
          setIsAllQuestChainCollapsedAction={setIsAllQuestChainCollapsedAction}
          setListDateAction={setListDate}
          setOptionalQuestsFilteredAction={setOptionalQuestsFilteredAction}
          setQuestNameFilterTextAction={setQuestNameFilterTextAction}
          title={title}
        />
      </div>
      {dailiesState.isLoading ? (
        <div className="flex h-full w-full flex-col">
          <heroui.Spinner
            className="dark z-1000"
            classNames={{ label: "text-foreground mt-4" }}
            variant="dots"
          />
        </div>
      ) : (
        <ScrollShadow
          hideScrollBar
          className="h-[calc(100vh-18vh)]"
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
              isAllQuestChainsCollapsed={isAllQuestChainsCollapsed}
              isDailyFilteredAction={isDailyFilteredAction}
              setDailiesAction={dailiesState.setDailies}
              totalWeight={dailiesState.totalWeight}
              user={userState.user}
              onUpdateAction={dailiesState.triggerRefreshDailies}
            />
          ))}
        </ScrollShadow>
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

  React.useEffect(() => {
    const get_config_is_quest_chains_collapsed = async () => {
      await invoke<boolean>("get_key_as_bool", {
        user_id: user.id,
        key: "quest-list--is-quest-chains-collapsed",
      }).then(result => setIsAllQuestChainCollapsed(result || false));
    };
    get_config_is_quest_chains_collapsed();
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

  const setIsAllQuestChainCollapsedAction = async (value: boolean): Promise<void> => {
    setIsAllQuestChainCollapsed(value);
    await invoke<boolean>("set_key_as_bool", {
      user_id: user.id,
      key: "quest-list--is-quest-chains-collapsed",
      value: value,
    });
  };

  const setQuestNameFilterTextAction = async (value: string): Promise<void> => {
    setQuestNameFilterText(value);
  };

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
    [isArchivedQuestsFiltered, isCompletedQuestsFiltered, isOptionalQuestsFiltered],
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
