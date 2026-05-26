import { ResultAsync } from "neverthrow";
import { RedirectType, redirect } from "next/navigation";

import { invoke } from "@/lib/tauri";
import { AppError, AppErrorContent } from "@/types/errors";

export function truncate_sessions(): ResultAsync<void, AppError> {
  return ResultAsync.fromPromise(
    invoke<void>("truncate_sessions", {}),
    (e: unknown) => new AppError(e as AppErrorContent),
  );
}

type logoutParams = {
  redirectPath?: string;
};

export default function logout(opts?: logoutParams): ResultAsync<never, AppError> {
  return truncate_sessions().andThen((_) =>
    redirect(opts && opts.redirectPath ? opts.redirectPath : "/login", RedirectType.replace),
  );
}
