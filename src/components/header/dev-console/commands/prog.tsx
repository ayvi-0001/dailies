import { exit, relaunch } from "@tauri-apps/plugin-process";

import type { TerminalCommand } from "@/components/ui/terminal";

const progCommands: TerminalCommand[] = [
  {
    name: "exit",
    run: async () => void (await exit(0)),
    aliases: ["quit", "q"],
    description: "exit app. aliases: quit, q",
  },
  {
    name: "relaunch",
    run: async () => await relaunch(),
    description: "relaunch app",
  },
];

export default progCommands;
