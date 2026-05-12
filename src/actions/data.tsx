import { toast } from "sonner";

import { User } from "@/app/providers/user";
import { invoke } from "@/lib/tauri";
import { Option } from "@/types/option";

export type UserExportDataSummary = {
  app_version: string;
  output_path: string;
  points: number;
  quest_chains: number;
  quests: number;
};

const exportUserData = async (user: Option<User>, path?: Option<string>) =>
  toast.promise<UserExportDataSummary>(
    async () =>
      await invoke<UserExportDataSummary>("export_user_data", {
        user: user,
        path: path ?? null,
      }),
    {
      loading: "Exporting data...",
      success: result => `Saved to ${result.output_path}`,
      error: "Error exporting data",
    },
  );

export type UserImportDataSummary = {
  quest_chains_inserted: number;
  quests_inserted: number;
  points_inserted: number;
  data_path: string;
};

const importUserData = async (user: Option<User>, path?: Option<string>) =>
  toast.promise<UserImportDataSummary>(
    async () =>
      await invoke<UserImportDataSummary>("import_user_data", {
        user: user,
        path: path ?? null,
      }),
    {
      loading: "Importing data...",
      success: result => `Imported data from ${result.data_path}`,
      error: "Error importing data",
    },
  );

export { exportUserData, importUserData };
