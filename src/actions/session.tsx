import { invoke } from "@tauri-apps/api/core";
import { Result, ResultAsync, err, ok } from "neverthrow";

import { User } from "@/app/providers/user";
import { decrypt } from "@/lib/session";
import { AppError, AppErrorContent } from "@/types/errors";
import { Option } from "@/types/option";

import { getUser } from "./user";

export type DecodedToken = {
  userName: string;
  iat: number;
};

export async function getSessionDecoded(): Promise<Result<DecodedToken, Error>> {
  const session: Result<string, Error> = await ResultAsync.fromPromise(
    invoke<Option<string>>("get_session"),
    (e: unknown) => new AppError(e as AppErrorContent),
  ).andThen((t) => (t ? ok(t) : err(new Error("No active session found"))));

  return await decrypt<DecodedToken>(session);
}

export async function getSessionUser(): Promise<Result<User, Error>> {
  const token: Result<DecodedToken, Error> = await getSessionDecoded();
  return token.asyncAndThen((t) => getUser({ name: t.userName, id: null }));
}
