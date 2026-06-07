"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";
import { emit } from "@tauri-apps/api/event";
import { okAsync } from "neverthrow";

import { setStoreObject } from "@/actions/store";
import { BackgroundSourceName, BackgroundSourceNames } from "@/app/background";

import SearchParamModal from "./modal";

export default function Modal(): React.ReactElement {
  const [settingsActionState, setSettingsActionState] = ReactUse.useSetState({
    editBackground: false,
  });

  return (
    <SearchParamModal
      modalContentAction={(moveProps, closeModal) =>
        function modalContent() {
          return (
            <>
              <heroui.ModalHeader {...moveProps} className="text-md justify-center">
                App Settings
              </heroui.ModalHeader>
              <heroui.ModalBody className="h-fit w-full overflow-hidden bg-black/90 text-sm">
                {settingsActionState.editBackground ? (
                  <div className="flex flex-col gap-3">
                    <EditBackgroundMenu
                      onCloseAction={() => setSettingsActionState({ editBackground: false })}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <heroui.Button
                      color="default"
                      size="sm"
                      variant="flat"
                      onPress={() => setSettingsActionState({ editBackground: true })}
                    >
                      Background
                    </heroui.Button>
                  </div>
                )}
              </heroui.ModalBody>
              <heroui.ModalFooter className="flex flex-col justify-center">
                <heroui.Divider />
                <heroui.Button color="danger" size="sm" variant="light" onPress={closeModal}>
                  Close
                </heroui.Button>
              </heroui.ModalFooter>
            </>
          );
        }
      }
      modalContentProps={{ className: "flex border-1 border-gray-600 bg-black/95" }}
      modalProps={{ className: "dark w-9/10 text-[#f0f0ff]" }}
      searchParamKey="modal"
    />
  );
}

export function EditBackgroundMenu(props: { onCloseAction: () => void }): React.ReactElement {
  return (
    <heroui.Dropdown className="dark text-white">
      <heroui.DropdownTrigger>
        <heroui.Button size="sm" variant="bordered">
          Select BackGround Source
        </heroui.Button>
      </heroui.DropdownTrigger>
      <heroui.DropdownMenu
        onAction={(key) => {
          setStoreObject("settings.json", "background", { source: key })
            .map(async (t) => okAsync(await t.save()))
            .mapErr((e) => console.log(e))
            .then(async () => { await emit("background-changed", { source: key }); });
          props.onCloseAction();
        }}
      >
        {(Object.keys(BackgroundSourceNames) as Array<keyof typeof BackgroundSourceNames>)
          .filter(
            (key) =>
              !(
                [
                  BackgroundSourceNames.Thunder,
                  BackgroundSourceNames.Evening2,
                  BackgroundSourceNames.Black,
                ] as Array<BackgroundSourceName>
              ).includes(BackgroundSourceNames[key] as BackgroundSourceName),
          )
          .map((key) => (
            <heroui.DropdownItem key={BackgroundSourceNames[key]} classNames={{ title: "text-sm" }}>
              {key}
            </heroui.DropdownItem>
          ))}
      </heroui.DropdownMenu>
    </heroui.Dropdown>
  );
}
