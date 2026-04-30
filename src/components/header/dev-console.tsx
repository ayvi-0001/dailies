"use client";

import * as React from "react";

import { today } from "@internationalized/date";
import { exit, relaunch } from "@tauri-apps/plugin-process";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { truncate_sessions } from "@/actions/logout";
import { getSession } from "@/actions/session";
import { AppMetaState, useAppMetaState } from "@/app/providers/app-meta";
import Terminal from "@/components/ui/terminal";
import type { TerminalCommand, TerminalContext } from "@/components/ui/terminal";
import { LOCAL_TZ } from "@/lib/dates";
import { formatDateTimeISO8601 } from "@/lib/dates";

export default function DevConsole({
  open,
  toggleOpenAction,
}: {
  open: boolean;
  toggleOpenAction: () => void;
}): React.ReactElement {
  const router: AppRouterInstance = useRouter();
  const appMeta: AppMetaState = useAppMetaState();

  const commands: TerminalCommand[] = [
    {
      name: "close",
      run: async () => toggleOpenAction(),
      aliases: ["c"],
      description: "close dev terminal. aliases: c",
    },
    {
      name: "exit",
      run: async () => void (await exit(0)),
      aliases: ["quit", "q"],
      description: "exit app. aliases: quit, q",
    },
    {
      name: "relaunch",
      run: async () => await relaunch(),
      description: "relaunch app.",
    },
    {
      name: "route",
      run: (ctx: TerminalContext) => router.replace(ctx.args.join(" ")),
    },
    {
      name: "platform",
      run: () => `${appMeta.platform}`,
      description: "show current platform",
    },
    {
      name: "size",
      run: async () =>
        `\
        width: ${appMeta.width}
        height: ${appMeta.height}
        orientation: ${appMeta.orientation}
      `.replace(/^ +/gm, ""),
      description: "show current size/orientation",
    },
    {
      name: "logout-all",
      run: async () => {
        await truncate_sessions();
        router.push("/login");
      },
      description: "logs out all users.",
    },
    {
      name: "insert_dailies",
      run: async () => {
        toast.promise(
          async () => {
            await (
              await import("@/lib/tauri")
            ).invoke("insert_dailies", {
              datetime: formatDateTimeISO8601(today(LOCAL_TZ).toDate(LOCAL_TZ), true),
            });
            window.location.reload();
          },
          {
            success: () => `Done, Reloading..`,
          },
        );
      },
      aliases: ["insert-dailies"],
      description: "run insert_dailies fn for current day.",
    },
  ];

  if (appMeta.platform == "android") {
    commands.push(
      {
        name: "export-db",
        run: async () =>
          void (await import("@tauri-apps/api/core")).invoke("export_db", {
            user_id: await getSession().then(r => r?.id),
          }),
        description:
          "export user quests/points to a fixed path at `/storage/emulated/0/Download/Dailies/export/dailies.db`.",
      },
      {
        name: "import-db",
        run: async () => {
          void (await import("@tauri-apps/api/core")).invoke("import_db", {
            user_id: await getSession().then(r => r?.id),
          });
        },
        description:
          "import user quests/points from a fixed path at `/storage/emulated/0/Download/Dailies/import/dailies.db`.",
      },
    );
  }

  return open ? (
    <div className="absolute z-1000 flex h-screen w-screen" id="dev-terminal">
      <Terminal className="p-5" commands={commands} welcome="enter c to close." />
    </div>
  ) : (
    <></>
  );
}
