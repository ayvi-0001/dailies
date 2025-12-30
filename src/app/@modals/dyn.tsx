"use client";

import * as React from "react";

import dynamic from "next/dynamic";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";

import { ModalParam } from "@/app/@modals/params";
import DailiesProvider from "@/components/daily/providers/dailies";
import { Option } from "@/types/option";

export default function App(): React.ReactElement {
  const searchParams: ReadonlyURLSearchParams = useSearchParams();
  const modal: Option<string> = searchParams.get("modal");

  switch (modal) {
    case ModalParam.AddQuest: {
      const Modal: React.ComponentType = dynamic(
        () => import(`@/app/@modals/add-quest`).then(mod => mod.default),
        { ssr: false },
      );
      return (
        <>
          <DailiesProvider>
            <Modal />
          </DailiesProvider>
        </>
      );
    }
    default: {
      return <></>;
    }
  }
}
