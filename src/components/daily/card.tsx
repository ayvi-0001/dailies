"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as RadixContextMenu from "@radix-ui/react-context-menu";
import * as ReactUse from "@reactuses/core";
import { AnimatePresence, motion } from "framer-motion";

import { User } from "@/app/providers/user";
import type { Option } from "@/types/option";

import CardBorder from "./border";
import {
  AbandonDailyMenuOption,
  ArchiveDailyMenuOption,
  EditMenuOption,
  HistoryMenuOption,
  RestoreDailyMenuOption,
} from "./context-menu/items";
import Details from "./details";
import HistoryDrawer from "./history";
import PointsInput from "./input";
import EditModal from "./modals/edit";
import PointsDisplay from "./points";
import {
  DEFAULT_QUEST_TYPE_STYLES,
  QuestType,
  QuestTypeStyles,
  useQuestTypes,
} from "./providers/quest-types";
import type { Daily } from "./types";

type DailyCardProps = {
  daily: Daily;
  minutelyRefresh: Date;
  totalWeight: number;
  user: User;
  onRefreshAction: () => void;
};

const MemoizedDailyCard = React.memo(DailyCard);
export default MemoizedDailyCard;

function DailyCard(props: DailyCardProps): React.ReactNode {
  const { daily, minutelyRefresh, totalWeight, user, onRefreshAction } = props;

  const [points, setPoints] = React.useState<Option<string>>(
    daily.points !== null ? `${daily.points}` : null,
  );

  const { value: historyIsOpen, toggle: toggleHistory } = ReactUse.useBoolean();
  const { value: contextMenuOpen, toggle: toggleContextMenu } = ReactUse.useBoolean();

  const editDisclosure = heroui.useDisclosure();

  const questTypes: QuestType[] = useQuestTypes();
  const questType: Option<QuestType> =
    questTypes.find(type => `${type.id}` == `${daily.type}`) || null;
  const questTypeStyles: QuestTypeStyles = questType?.styles || DEFAULT_QUEST_TYPE_STYLES;

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  React.useEffect(() => setIsLoading(false), [daily]);

  return (
    <>
      <RadixContextMenu.Root modal onOpenChange={toggleContextMenu}>
        <RadixContextMenu.Trigger className="flex">
          <CardBorder
            daily={daily}
            divProps={{ className: questTypeStyles.borderClass as string }}
            minutelyRefresh={minutelyRefresh}
          >
            <AnimatePresence>
              <motion.div
                key={`card-effect-${daily.pointId}`}
                animate={isLoading ? { opacity: 0 } : {}}
                className="flex w-full min-w-0 flex-row justify-between gap-2 p-1"
                initial={isLoading ? { opacity: 100 } : {}}
                transition={
                  isLoading
                    ? { duration: 0.6, repeat: Infinity, repeatType: "reverse" }
                    : { duration: 0, repeat: 0 }
                }
              >
                <CardContent
                  daily={daily}
                  name={daily.name}
                  questType={questType}
                  questTypeStyles={questTypeStyles}
                />
                <CardStats
                  daily={daily}
                  points={points}
                  setPointsAction={setPoints}
                  totalWeight={totalWeight}
                  onRefreshAction={React.useCallback(() => {
                    setIsLoading(true);
                    onRefreshAction();
                  }, [onRefreshAction])}
                />
              </motion.div>
            </AnimatePresence>
          </CardBorder>
        </RadixContextMenu.Trigger>
        <RadixContextMenu.Portal>
          <AnimatePresence>
            {contextMenuOpen && (
              <ContextMenuContent
                daily={daily}
                editOnOpenAction={editDisclosure.onOpen}
                setPointsAction={setPoints}
                toggleHistoryAction={toggleHistory}
                user_id={user.id}
                onRefreshAction={onRefreshAction}
              />
            )}
          </AnimatePresence>
        </RadixContextMenu.Portal>
      </RadixContextMenu.Root>
      <EditModal
        daily={daily}
        isOpen={editDisclosure.isOpen}
        setIsLoadingAction={setIsLoading}
        title={daily.name}
        user={user}
        onOpenChange={editDisclosure.onOpenChange}
      />
      <HistoryDrawer
        daily={daily}
        isOpen={historyIsOpen}
        minutelyRefresh={minutelyRefresh}
        setHistoryIsOpenAction={toggleHistory}
        totalWeight={totalWeight}
        user={user}
      />
    </>
  );
}

type CardContentProps = {
  daily: Daily;
  descriptionContent?: "description" | "note";
  name: string;
  questType: Option<QuestType>;
  questTypeStyles: QuestTypeStyles;
};

export const CardContent = React.memo((props: CardContentProps): React.ReactElement => {
  const { daily, descriptionContent, questType, questTypeStyles, name } = props;

  return (
    <div className="flex min-w-0 grow flex-col items-stretch gap-[2]">
      <QuestName name={name} />
      <Details
        daily={daily}
        descriptionContent={descriptionContent}
        questType={questType}
        questTypeStyles={questTypeStyles}
      />
    </div>
  );
});

CardContent.displayName = "CardContent";

export function QuestName({ name }: { name: string }): React.ReactElement {
  return (
    <div className="w-full wrap-anywhere">
      <p className="overflow-hidden pb-[1] text-xl leading-none font-bold tracking-tight text-ellipsis whitespace-nowrap">
        {name}
      </p>
    </div>
  );
}

type CardStatsProps = {
  daily: Daily;
  points: Option<string>;
  totalWeight: number;
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>;
  onRefreshAction: () => void;
};

export function CardStats(props: CardStatsProps): React.ReactElement {
  const { daily, points, totalWeight, setPointsAction, onRefreshAction } = props;

  return (
    <div className="flex flex-none flex-col justify-between gap-1">
      <div className="place-items-end justify-self-end-safe">
        <PointsDisplay daily={daily} points={points} totalWeight={totalWeight} />
      </div>
      <div className="place-items-end justify-self-end-safe">
        <PointsInput
          daily={daily}
          points={points}
          setPointsAction={setPointsAction}
          onRefreshAction={onRefreshAction}
        />
      </div>
    </div>
  );
}

type ContextMenuContentProps = {
  daily: Daily;
  editOnOpenAction: () => void;
  onRefreshAction: () => void;
  setPointsAction: React.Dispatch<React.SetStateAction<Option<string>>>;
  toggleHistoryAction?: () => void;
  user_id: number;
};

export function ContextMenuContent(props: ContextMenuContentProps): React.ReactElement {
  const {
    daily,
    editOnOpenAction,
    onRefreshAction,
    setPointsAction,
    toggleHistoryAction,
    user_id,
  } = props;

  return (
    <RadixContextMenu.Content asChild forceMount className="dark relative z-100 bg-black p-2">
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 flex flex-col gap-3 border-2 border-black bg-black/90"
        exit={{ opacity: 0, scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        {daily.points !== null && (
          <AbandonDailyMenuOption
            daily={daily}
            setPointsAction={setPointsAction}
            onRefreshAction={onRefreshAction}
          />
        )}
        <EditMenuOption onOpen={editOnOpenAction} />
        {toggleHistoryAction && <HistoryMenuOption toggleHistory={toggleHistoryAction} />}
        {!daily.archived ? (
          <ArchiveDailyMenuOption
            daily={daily}
            setPointsAction={setPointsAction}
            user_id={user_id}
            onRefreshAction={onRefreshAction}
          />
        ) : (
          <RestoreDailyMenuOption
            daily={daily}
            setPointsAction={setPointsAction}
            user_id={user_id}
            onRefreshAction={onRefreshAction}
          />
        )}
      </motion.div>
    </RadixContextMenu.Content>
  );
}
