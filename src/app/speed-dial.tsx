"use client";

import * as React from "react";

import { BookPlusIcon, ChartAreaIcon, LogOutIcon } from "lucide-react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation";

import { truncate_sessions } from "@/actions/logout";
import Speeddial from "@/components/animata/container/speed-dial";
import { updateParam } from "@/lib/params";

import { ModalParam } from "./@modals/params";

export default function App(): React.ReactElement {
  const router: AppRouterInstance = useRouter();

  const searchParams: ReadonlyURLSearchParams = useSearchParams();

  const actionButtons = [
    {
      icon: <LogOutIcon size={14} />,
      label: <p className="text-xs">Logout</p>,
      key: "logout",
      buttonAction: async () => {
        await truncate_sessions();
        router.push("/login");
      },
    },
    {
      icon: <ChartAreaIcon size={16} />,
      label: <p className="text-xs">Stats</p>,
      key: "add",
      buttonAction: () =>
        updateParam(router, searchParams, [{ key: "modal", value: ModalParam.Stats }]),
    },
    {
      icon: <BookPlusIcon size={14} />,
      label: <p className="text-xs">Add Quest</p>,
      key: "add",
      buttonAction: () =>
        updateParam(router, searchParams, [{ key: "modal", value: ModalParam.AddQuest }]),
    },
  ];

  return (
    <div suppressHydrationWarning>
      <Speeddial
        actionButtons={actionButtons}
        buttonProps={{ className: " border-none order-last" }}
        direction="up"
        props={{ className: "dark z-999 absolute left-0 bottom-0 mb-6 ml-6 bg-transparent" }}
      />
    </div>
  );
}
