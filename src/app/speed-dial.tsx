"use client";

import * as React from "react";

import { exit } from "@tauri-apps/plugin-process";
import { BookPlusIcon, BoxIcon, CircleXIcon, LogOutIcon } from "lucide-react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation";

import { truncate_sessions } from "@/actions/logout";
import { ModalParam } from "@/app/(app)/@modals/params";
import Speeddial, { SpeeddialDirection } from "@/components/animata/container/speed-dial";
import { updateParam } from "@/lib/params";

export default function App(): React.ReactElement {
  const router: AppRouterInstance = useRouter();

  const searchParams: ReadonlyURLSearchParams = useSearchParams();

  const actionButtons = [
    {
      icon: <CircleXIcon size={14} stroke="#f0f0ff" />,
      label: <p className="text-xs">Exit</p>,
      key: "exit",
      buttonAction: async () => {
        await exit(0);
      },
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
      icon: <BookPlusIcon size={14} stroke="#f0f0ff" />,
      label: <p className="text-xs">Add Quest</p>,
      key: "add",
      buttonAction: () =>
        updateParam(router, searchParams, [{ key: "modal", value: ModalParam.AddQuest }]),
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
