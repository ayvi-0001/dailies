import * as React from "react";

import * as heroui from "@heroui/react";
import * as log from "@tauri-apps/plugin-log";
import clsx from "clsx";
import { ValueOf } from "next/dist/shared/lib/constants";

import editQuest, { EditQuestState } from "@/actions/edit-quest";
import { User } from "@/app/providers/user";
import { camelCaseToSnakeCase } from "@/lib/string";
import { invoke } from "@/lib/tauri";
import type { Option } from "@/types/option";

import { DailiesState, Daily, useDailies } from "../../daily";
import EditDailyForm from "../forms/edit";
import { QuestType, useQuestTypes } from "../providers/quest-types";

type EditModalProps = {
  user: User;
  daily: Daily;
  isOpen: boolean;
  onOpenChange: () => void;
  title: string;
  historic?: boolean;
};

export default function EditModal(props: EditModalProps): React.ReactNode {
  const { user, daily, isOpen, onOpenChange, title, historic } = props;

  const dailiesState: DailiesState = useDailies();
  const questTypes: QuestType[] = useQuestTypes();

  const formRef: React.RefObject<Option<HTMLFormElement>> = React.useRef(null);

  const draggableRef = React.useRef<Option<HTMLElement>>(null);
  const { moveProps } = heroui.useDraggable({
    targetRef: draggableRef as React.RefObject<HTMLElement>,
    canOverflow: true,
    isDisabled: false,
  });

  const [_, dispatch, isPending] = React.useActionState(
    async (state: EditQuestState, payload: FormData): Promise<EditQuestState> => {
      const diff = (await editQuest(state, payload, daily, questTypes)) as Partial<Daily>;
      if (Object.hasOwn(diff, "errors")) return;

      const dailies: Daily[] = dailiesState.dailies;

      log.debug(JSON.stringify(diff));

      for (const entry of Object.entries(diff)) {
        let key = entry[0];

        const value = entry[1];
        const sendValue = typeof value === "boolean" ? !!value : value;

        if (key == "typeId") key = "type";

        await invoke(`update_${camelCaseToSnakeCase(key)}`, {
          user_id: user.id,
          quest_id: daily.questId,
          point_id: daily.pointId,
          value: sendValue,
        }).then(_ => {
          dailies.map(d => {
            if (d.pointId == daily.pointId) {
              // @ts-expect-error: TODO(ayvi): fix types on daily index
              d[key as keyof Daily] = value as ValueOf<Daily>;
            }
            return d;
          });
        });
      }

      if (Object.entries(diff).length > 0) {
        dailiesState.setDailies(dailies);
        dailiesState.triggerRefreshDailies();
      }
    },
    undefined,
  );

  return (
    <>
      <heroui.Modal
        ref={draggableRef}
        disableAnimation
        hideCloseButton
        isKeyboardDismissDisabled
        shouldBlockScroll
        backdrop="transparent"
        className="dark w-9/10 text-white select-none"
        isDismissable={false}
        isOpen={isOpen}
        motionProps={{
          variants: {
            enter: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
            exit: { y: -20, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
          },
        }}
        placement="center"
        radius="none"
        shadow="lg"
        size="sm"
        onOpenChange={onOpenChange}
      >
        <heroui.ModalContent className="flex border-1 border-gray-600 bg-black/95">
          {onClose => (
            <>
              <heroui.ModalHeader
                {...moveProps}
                className="text-md flex flex-col gap-1 justify-self-center"
              >
                {title}
              </heroui.ModalHeader>
              <heroui.ModalBody className="h-[50vh] bg-black/90 text-white">
                <heroui.ScrollShadow
                  hideScrollBar
                  className={clsx("h-[calc(100vh-50vh)]", historic && "h-[calc(100vh-75h)]")}
                  offset={100}
                >
                  <EditDailyForm
                    daily={daily}
                    dispatch={dispatch}
                    formRef={formRef}
                    historic={historic}
                    onSubmit={onClose}
                  />
                </heroui.ScrollShadow>
              </heroui.ModalBody>
              <heroui.ModalFooter className="mt-4 mb-3 flex justify-center gap-2 leading-none font-medium select-none">
                <heroui.Button color="danger" size="sm" variant="light" onPress={onClose}>
                  close
                </heroui.Button>
                <heroui.Button
                  color="primary"
                  disabled={isPending}
                  isLoading={isPending}
                  size="sm"
                  type="submit"
                  onPress={() => formRef?.current?.requestSubmit()}
                >
                  save
                </heroui.Button>
              </heroui.ModalFooter>
            </>
          )}
        </heroui.ModalContent>
      </heroui.Modal>
    </>
  );
}
