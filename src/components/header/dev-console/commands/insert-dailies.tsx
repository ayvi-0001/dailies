import { today } from "@internationalized/date";
import { toast } from "sonner";

import type { TerminalCommand } from "@/components/ui/terminal";
import { LOCAL_TZ } from "@/lib/dates";
import { formatDateTimeISO8601 } from "@/lib/dates";

const commandInsertDailies: TerminalCommand = {
  name: "insert-dailies",
  run: async () => {
    toast.promise(async () => {
      await (
        await import("@/lib/tauri")
      ).invoke("insert_dailies", {
        datetime: formatDateTimeISO8601(today(LOCAL_TZ).toDate(LOCAL_TZ), true),
      });
      window.location.reload();
    });
  },
};

export default commandInsertDailies;
