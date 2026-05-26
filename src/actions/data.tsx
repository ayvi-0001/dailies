import { ResultAsync } from "neverthrow";

import { User } from "@/app/providers/user";
import { invoke } from "@/lib/tauri";
import { AppError, AppErrorContent } from "@/types/errors";
import { Option } from "@/types/option";

export type UserExportDataSummary = {
  app_version: string;
  output_path: string;
  points: number;
  quest_chains: number;
  quests: number;
};

export function exportUserData(
  user: User,
  path?: Option<string>,
): ResultAsync<UserExportDataSummary, AppError> {
  return ResultAsync.fromPromise(
    invoke<UserExportDataSummary>("export_user_data", {
      user: user,
      path: path ?? null,
    }),
    (e: unknown) => new AppError(e as AppErrorContent),
  );
}

export type UserImportDataSummary = {
  quest_chains_inserted: number;
  quests_inserted: number;
  points_inserted: number;
  data_path: string;
};

export function importUserData(
  user: User,
  path?: Option<string>,
): ResultAsync<UserImportDataSummary, AppError> {
  return ResultAsync.fromPromise(
    invoke<UserImportDataSummary>("import_user_data", {
      user: user,
      path: path ?? null,
    }),
    (e: unknown) => new AppError(e as AppErrorContent),
  );
}
