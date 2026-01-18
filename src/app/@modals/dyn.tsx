"use client";

import * as React from "react";

import dynamic from "next/dynamic";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";

import { ModalParam } from "@/app/@modals/params";
import UserProvider from "@/app/providers/user";
import DailiesProvider from "@/components/daily/providers/dailies";

export default function App(): React.ReactElement {
  const searchParams: ReadonlyURLSearchParams = useSearchParams();

  switch (searchParams.get("modal")) {
    case ModalParam.AddQuest: {
      const Modal: React.ComponentType = dynamic(
        () => import(`@/app/@modals/add-quest`).then(mod => mod.default),
        { ssr: false },
      );
      return (
        <UserProvider>
          <DailiesProvider>
            <Modal />
          </DailiesProvider>
        </UserProvider>
      );
    }
    case ModalParam.Stats: {
      const Modal: React.ComponentType = dynamic(
        () => import(`@/app/@modals/stats`).then(mod => mod.default),
        { ssr: false },
      );
      return (
        <UserProvider>
          <DailiesProvider>
            <Modal />
          </DailiesProvider>
        </UserProvider>
      );
    }
    default: {
      return <></>;
    }
  }
}
