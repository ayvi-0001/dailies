import { invoke } from "@tauri-apps/api/core";
import { RedirectType, redirect } from "next/navigation";

export async function truncate_sessions(): Promise<void> {
  await invoke<void>("truncate_sessions", {}).catch(console.error);
}

export default async function logout(): Promise<void> {
  await truncate_sessions();
  redirect("/login", RedirectType.replace);
}
