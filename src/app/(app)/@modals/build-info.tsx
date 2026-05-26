"use client";

import * as React from "react";

import * as heroui from "@heroui/react";

import { AppMetaState, useAppMetaState } from "@/app/providers/app-meta";

import SearchParamModal from "./modal";

export default function Modal(): React.ReactElement {
  const appMeta: AppMetaState = useAppMetaState();

  return (
    <SearchParamModal
      modalContentAction={(moveProps, _closeModal) =>
        function modalContent() {
          return (
            <>
              <heroui.ModalHeader {...moveProps} className="text-md justify-center">
                About
              </heroui.ModalHeader>
              <heroui.ModalBody className="h-fit w-full items-center overflow-hidden bg-black/90 px-0">
                <>
                  <div className="text-xs">
                    <p>App: {appMeta.buildInfo?.name}</p>
                    <p>Identifier: {appMeta.buildInfo?.identifier}</p>
                    <p>Version: {appMeta.buildInfo?.version}</p>
                    {appMeta.buildInfo?.bundleType && (
                      <p>Bundle Type: {appMeta.buildInfo.bundleType}</p>
                    )}
                    <heroui.Divider className="my-2" />
                    <p>Env: {appMeta.env}</p>
                    <p>Build Date: {appMeta.buildTimestamp?.toString().replace(/\[.*$/, "")}</p>
                    <p>Target Triple: {appMeta.cargoTargetTriple}</p>
                    <heroui.Divider className="my-2" />
                    <p>Git Describe: {appMeta.gitDescribe}</p>
                    <p>
                      Git Sha:<span className="text-[11px]"> {appMeta.gitSha}</span>
                    </p>
                    {appMeta.gitDirty && (
                      <p>
                        Is Dirty
                        <br />
                        <span>
                          Insertions: {/^-dev\+(\d+)-(\d+)$/.exec(appMeta.gitDirty)?.at(1)}
                        </span>
                        <br />
                        <span>
                          Deletions: {/^-dev\+(\d+)-(\d+)$/.exec(appMeta.gitDirty)?.at(2)}
                        </span>
                      </p>
                    )}
                    <heroui.Divider className="my-2" />
                    <p>Nextjs Version: {appMeta.nextVersion}</p>
                    <p>Tauri Version: {appMeta?.buildInfo?.tauriVersion}</p>
                  </div>
                </>
              </heroui.ModalBody>
              <heroui.ModalFooter />
            </>
          );
        }
      }
      modalContentProps={{ className: "flex border-1 border-gray-600 bg-black/95" }}
      modalProps={{ className: "dark w-9/10 text-[#f0f0ff]", backdrop: "blur" }}
      searchParamKey="modal"
    />
  );
}
