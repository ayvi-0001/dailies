"use client";

import * as React from "react";

import { exit } from "@tauri-apps/plugin-process";
import {
  BookMarkedIcon,
  BookPlusIcon,
  BookUserIcon,
  BoxIcon,
  CircleXIcon,
  ImportIcon,
  LogOutIcon,
  UploadIcon,
} from "lucide-react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation";

import { truncate_sessions } from "@/actions/logout";
import { ModalParam } from "@/app/(app)/@modals/params";
import Speeddial, { SpeeddialDirection } from "@/components/animata/container/speed-dial";
import dataCommands from "@/components/header/dev-console/commands/data";
import { TerminalContext } from "@/components/ui/terminal";
import { updateParam } from "@/lib/params";

export default function App(): React.ReactElement {
  const router: AppRouterInstance = useRouter();
  const searchParams: ReadonlyURLSearchParams = useSearchParams();

  // TODO(ayvi): unhide export/import functions
  const actionButtons = [
    {
      icon: <BookUserIcon size={14} stroke="#f0f0ff" />,
      label: <p className="text-xs">User</p>,
      key: "user",
      buttonAction: () =>
        updateParam(router, searchParams, [{ key: "modal", value: ModalParam.User }]),
    },
    {
      icon: <BookMarkedIcon size={14} stroke="#f0f0ff" />,
      label: <p className="text-xs">Quest Chains</p>,
      key: "quest-chains",
      buttonAction: () =>
        updateParam(router, searchParams, [{ key: "modal", value: ModalParam.QuestChains }]),
    },
    {
      icon: <BookPlusIcon size={14} stroke="#f0f0ff" />,
      label: <p className="text-xs">Add Quest</p>,
      key: "add-quest",
      buttonAction: () =>
        updateParam(router, searchParams, [{ key: "modal", value: ModalParam.AddQuest }]),
    },
    {
      icon: <UploadIcon size={14} stroke="#f0f0ff" />,
      label: <p className="text-xs">Export Data</p>,
      key: "export-data",
      hidden: true,
      buttonAction: async () =>
        await dataCommands[0].run({ args: [] } as unknown as TerminalContext),
    },
    {
      icon: <ImportIcon size={14} stroke="#f0f0ff" />,
      label: <p className="text-xs">Import Data</p>,
      key: "import-data",
      hidden: true,
      buttonAction: async () =>
        await dataCommands[1].run({ args: [] } as unknown as TerminalContext),
    },
    {
      icon: <LogOutIcon size={14} stroke="#f0f0ff" />,
      label: <p className="text-xs">Logout</p>,
      key: "logout",
      buttonAction: async () => {
        await truncate_sessions();
        router.push("/login");
      },
    },
    {
      icon: <CircleXIcon size={14} stroke="#f0f0ff" />,
      label: <p className="text-xs">Exit</p>,
      key: "exit",
      buttonAction: async () => await exit(0),
    },
  ];

  return (
    <Speeddial
      actionButtons={actionButtons}
      buttonIcon={<BoxIcon size={16} stroke="#f0f0ff" />}
      direction={SpeeddialDirection.up}
      divProps={{ className: "dark z-999 absolute left-6 bottom-6" }}
    />
  );
}
