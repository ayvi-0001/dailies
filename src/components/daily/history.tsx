import * as React from "react";

import * as heroui from "@heroui/react";
import * as RadixContextMenu from "@radix-ui/react-context-menu";
import * as ReactUse from "@reactuses/core";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@heroui/react";
import { ScrollShadow } from "@heroui/react";
import { AnimatePresence } from "framer-motion";

import * as User from "@/app/providers/user";
import { cachedQueryDailyHistory } from "@/actions/query";
import { formatDateISO8601 } from "@/lib/dates";
import { call } from "@/lib/utils";
import type { Option } from "@/types/option";

import CardBorder from "./border";
import { CardContent, CardStats, ContextMenuContent } from "./card";
import EditModal from "./modals/edit";
import {
  DEFAULT_QUEST_TYPE_STYLES,
  QuestType,
  QuestTypeStyles,
  useQuestTypes,
} from "./providers/quest-types";
import type { Daily } from "./types";

// TODO(ayvi): history days options/streaming http://ayvi:3000/ayvi/dailies/issues/32

type HistoryDrawerProps = {
  isOpen: boolean;
  setHistoryIsOpenAction: React.Dispatch<React.SetStateAction<boolean>>;
  daily: Daily;
  // TODO(ayvi): totalWeight for history should eval for the respective day
  // http://ayvi:3000/ayvi/dailies/issues/35
  totalWeight: number;
};

export default function HistoryDrawer(props: HistoryDrawerProps): React.ReactElement {
  const { isOpen, setHistoryIsOpenAction, daily, totalWeight } = props;

  const user: User.User = User.useState().user!;

  return (
    <Drawer
      hideCloseButton
      isDismissable
      isKeyboardDismissDisabled
      className="border-1 border-white bg-black/85"
      isOpen={isOpen}
      placement="bottom"
      radius="none"
      size="2xl"
    >
      <DrawerContent>
        {onClose => (
          <div>
            <DrawerHeader className="flex flex-col gap-1 text-white">{daily.name}</DrawerHeader>
            <DrawerBody>
              <div>
                <HistoryCards
                  query={cachedQueryDailyHistory(userName, daily.questId, 6)}
                  totalWeight={totalWeight}
                  userId={user.id}
                />
              </div>
            </DrawerBody>
            <DrawerFooter className="mt-4 mb-3 flex justify-center gap-2 leading-none">
              <Button
                color="danger"
                size="sm"
                variant="flat"
                onPress={() => {
                  setHistoryIsOpenAction(!history);
                  onClose();
                }}
              >
                Close
              </Button>
            </DrawerFooter>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

type HistoryCardsProps = {
  userId: number;
  query: Promise<Daily[]>;
  totalWeight: number;
};

// TODO(ayvi): infinite scroll history http://ayvi:3000/ayvi/dailies/issues/33
export function HistoryCards(props: HistoryCardsProps): React.ReactElement {
  const { userId, query, totalWeight } = props;

  const [dailies, setDailies] = React.useState<Daily[]>([]);

  React.useEffect(() => {
    call(async () => setDailies(await query));
  }, [query]);

  return (
    <ScrollShadow
      hideScrollBar
      className="h-[calc(100vh-60vh)] rounded-md"
      offset={80}
      size={10}
      style={{ scrollbarWidth: "none" }}
    >
      <React.Suspense fallback={<div>Loading...</div>}>
        {dailies?.map((daily: Daily, index: number) => (
          <div key={`${daily.pointId}-${index}`} className="mr-2 mb-4 ml-2">
            <HistoryDailyCard
              daily={daily}
              index={index}
              totalWeight={totalWeight}
              userId={userId}
            />
          </div>
        ))}
      </React.Suspense>
    </ScrollShadow>
  );
}

type HistoryDailyCardProps = {
  userId: number;
  daily: Daily;
  index: number;
  totalWeight: number;
};

export function HistoryDailyCard(props: HistoryDailyCardProps): React.ReactElement {
  const { userId, daily, index, totalWeight } = props;

  const questTypes: QuestType[] = useQuestTypes();
  const questType: Option<QuestType> =
    questTypes.find(type => `${type.id}` == `${daily.type}`) || null;
  const questTypeStyles: QuestTypeStyles = questType?.styles || DEFAULT_QUEST_TYPE_STYLES;

  const [points, setPoints] = React.useState<Option<string>>(`${daily.points}`);
  const { isOpen, onOpen, onOpenChange } = heroui.useDisclosure();
  const { value: contextMenuOpen, toggle: toggleContextMenu } = ReactUse.useBoolean();

  return (
    <>
      <RadixContextMenu.Root modal onOpenChange={toggleContextMenu}>
        <RadixContextMenu.Trigger className="flex items-center justify-center">
          <CardBorder daily={daily} divProps={{ className: questTypeStyles.borderClass as string }}>
            <div className="flex w-full min-w-0 flex-row justify-between gap-2 p-1">
              <CardContent
                daily={daily}
                name={formatDateISO8601(daily.date)}
                questType={questType}
                questTypeStyles={questTypeStyles}
              />
              <CardStats
                daily={daily}
                points={points}
                setPointsAction={setPoints}
                totalWeight={totalWeight}
                onRefreshAction={() => {}}
              />
            </div>
          </CardBorder>
        </RadixContextMenu.Trigger>
        <RadixContextMenu.Portal>
          <AnimatePresence>
            {contextMenuOpen && (
              <ContextMenuContent
                daily={daily}
                editOnOpenAction={onOpen}
                setPointsAction={setPoints}
                onRefreshAction={() => {}}
              />
            )}
          </AnimatePresence>
        </RadixContextMenu.Portal>
      </RadixContextMenu.Root>
      <EditModal
        key={`${daily.pointId}-${index}`}
        historic
        daily={daily}
        isOpen={isOpen}
        title={`${daily.name} (${daily.date})`}
        userId={userId}
        onOpenChange={onOpenChange}
      />
    </>
  );
}
