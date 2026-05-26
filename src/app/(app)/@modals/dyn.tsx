"use client";

import * as React from "react";

import dynamic from "next/dynamic";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";

import { ModalParam } from "./params";

export default function App(): React.ReactElement {
  const searchParams: ReadonlyURLSearchParams = useSearchParams();

  switch (searchParams.get("modal")) {
    case ModalParam.AddQuest: {
      const Modal: React.ComponentType = dynamic(
        () => import(`./add-quest`).then((mod) => mod.default),
        { ssr: false },
      );
      return <Modal />;
    }
    case ModalParam.BuildInfo: {
      const Modal: React.ComponentType = dynamic(
        () => import(`./build-info`).then((mod) => mod.default),
        { ssr: false },
      );
      return <Modal />;
    }
    case ModalParam.QuestChains: {
      const Modal: React.ComponentType = dynamic(
        () => import(`./quest-chains`).then((mod) => mod.default),
        { ssr: false },
      );
      return <Modal />;
    }
    case ModalParam.Stats: {
      const Modal: React.ComponentType = dynamic(
        () => import(`./stats`).then((mod) => mod.default),
        { ssr: false },
      );
      return <Modal />;
    }
    case ModalParam.User: {
      const Modal: React.ComponentType = dynamic(
        () => import(`./user`).then((mod) => mod.default),
        { ssr: false },
      );
      return <Modal />;
    }
    default: {
      return <></>;
    }
  }
}
