"use client";

import * as React from "react";

import clsx from "clsx";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";

import { truncate_sessions } from "@/actions/logout";
import { AppMetaState, useAppMetaState } from "@/app/providers/app-meta";
import Terminal from "@/components/ui/terminal";
import type { TerminalCommand, TerminalContext } from "@/components/ui/terminal";
import { cn } from "@/lib/utils";

import dataCommands from "./commands/data";
import commandInsertDailies from "./commands/insert-dailies";
import progCommands from "./commands/prog";
import queryCommands from "./commands/query";

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
      description: "logs out all users",
    },
    {
      name: "change-password",
      run: async (ctx: TerminalContext) => {
        return await (
          await import("@tauri-apps/api/core")
        ).invoke("update_password", {
          user_id: ctx.args.at(0),
          current_password: ctx.args.at(1),
          new_password: ctx.args.at(2),
        });
      },
    },
    commandInsertDailies,
    ...progCommands,
    ...dataCommands,
    ...queryCommands,
  ];

  return open ? (
    <div className="absolute z-1000 flex h-screen w-screen" id="dev-terminal">
      <Terminal
        className={cn("p-5", clsx(open && "select-text"))}
        commands={commands}
        welcome="enter c to close."
      />
    </div>
  ) : (
    <></>
  );
}
