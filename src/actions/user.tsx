import { invoke } from "@tauri-apps/api/core";
import { Result, ResultAsync } from "neverthrow";

import type { User } from "@/app/providers/user";
import { AppError, AppErrorContent } from "@/types/errors";
import { Option } from "@/types/option";

type getUserParams = {
  name: Option<string>;
  id: Option<string>;
};

export function getUser(params: getUserParams): ResultAsync<User, Error> {
  return ResultAsync.fromPromise(
    invoke<User>("get_user", params),
    (e: unknown) => new AppError(e as AppErrorContent),
  );
}

type createUserParams = {
  name: string;
  password: string;
};

export async function createUser(params: createUserParams): Promise<Result<User, Error>> {
  return ResultAsync.fromPromise(
    invoke<User>("create_user", params),
    (e: unknown) => new AppError(e as AppErrorContent),
  );
}

type verifyUserParams = {
  name: string;
  id: null;
  password: string;
};

export async function verifyUser(params: verifyUserParams): Promise<Result<User, Error>> {
  return ResultAsync.fromPromise(
    invoke<User>("verify_user", params),
    (e: unknown) => new AppError(e as AppErrorContent),
  );
}
