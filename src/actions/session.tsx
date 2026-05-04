import { invoke } from "@tauri-apps/api/core";
import { ok } from "assert";

import { DecodedToken, User } from "@/app/providers/user";
import { decrypt } from "@/lib/session";
import { Option } from "@/types/option";

export async function getSession(): Promise<Option<User>> {
  let user: Option<User> = null;

  try {
    const session = await invoke<Option<string>>("get_session");
    const token = await decrypt<DecodedToken>(session);
    const payload = { name: token?.userName, id: null };
    user = await invoke<User>("get_user", payload);
  } catch (err: unknown) {
    throw err;
  }

  ok(user, new Error("Failed to retrieve session"));

  return user;
}
