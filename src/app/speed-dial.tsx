"use client";

import * as React from "react";

import { getLocalTimeZone, today } from "@internationalized/date";
import { BookPlusIcon, ListRestartIcon, LogOutIcon } from "lucide-react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { truncate_sessions } from "@/actions/logout";
import Speeddial from "@/components/animata/container/speed-dial";
import { formatDateTimeISO8601 } from "@/lib/dates";
import { invoke } from "@/lib/tauri";

import { ModalParam } from "./@modals/params";

export default function App(): React.ReactElement {
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

  const updateParam = (values: Array<{ key: string; value: string }>): void => {
    router.push(`?${createQueryString(values)}`);
  };

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
      icon: <BookPlusIcon size={14} />,
      label: <p className="text-xs">Add Quest</p>,
      key: "add",
      buttonAction: () => updateParam([{ key: "modal", value: ModalParam.AddQuest }]),
    },
    {
      icon: <ListRestartIcon size={14} />,
      label: <p className="text-xs">Insert Dailies</p>,
      key: "insert-dailies",
      buttonAction: async () => {
        toast.promise(
          async () => {
            await invoke("insert_dailies", {
              datetime: formatDateTimeISO8601(
                today(getLocalTimeZone()).toDate(getLocalTimeZone()),
                true,
              ),
            });
            window.location.reload();
          },
          {
            success: () => {
              return `Done, Reloading..`;
            },
            // backend will toast error type and message
            // error: err => JSON.stringify(err),
          },
        );
      },
    },
  ];

  return (
    <div suppressHydrationWarning>
      <Speeddial
        actionButtons={actionButtons}
        buttonProps={{ className: " border-none order-last" }}
        direction="up"
        props={{ className: "dark z-999 absolute left-0 bottom-0 mb-4 ml-4 bg-transparent" }}
      />
    </div>
  );
}
