import { invoke } from "@tauri-apps/api/core";
import { ResultAsync } from "neverthrow";

import { QuestType } from "@/components/daily/providers/quest-types";
import type { Daily, QuestChain } from "@/components/daily/types";
import { AppError, AppErrorContent } from "@/types/errors";
import { Option } from "@/types/option";

type queryDailiesParams = {
  user: Option<string>;
  quest_id?: Option<string>;
  start_date: string;
  end_date: string;
};

export function queryDailies<T = Daily[]>(params: queryDailiesParams): ResultAsync<T, AppError> {
  return ResultAsync.fromPromise(
    invoke<T>("query_dailies", { ...{ quest_id: null }, ...params }),
    (e: unknown) => new AppError(e as AppErrorContent),
  );
}

type queryQuestChainsParams = {
  user_id: Option<number>;
};

export function queryQuestChains(
  params: queryQuestChainsParams,
): ResultAsync<QuestChain[], AppError> {
  return ResultAsync.fromPromise(
    invoke<QuestChain[]>("query_quest_chains", params),
    (e: unknown) => new AppError(e as AppErrorContent),
  );
}

export function queryQuestTypes<T = QuestType[]>(): ResultAsync<T, AppError> {
  return ResultAsync.fromPromise(
    invoke<T>("get_quest_types"),
    (e: unknown) => new AppError(e as AppErrorContent),
  );
}
