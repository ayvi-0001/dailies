import { invoke } from "@tauri-apps/api/core";
import { RedirectType, redirect } from "next/navigation";
import { z } from "zod";

import type { Session } from "@/app/providers/user";
import { createSession } from "@/lib/session";
import type { AppError } from "@/types/errors";

export const LoginFormSchema = z.object({
  username: z.string().trim(),
  password: z.string().trim(),
});

export type LoginErrors = {
  errors?: {
    username?: string[];
    password?: string[];
    other?: string[];
  };
};

export type LoginState = LoginErrors | undefined;

export default async function login(_: LoginState, formData: FormData): Promise<LoginErrors> {
  const validatedFields = LoginFormSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    const errTree = z.treeifyError(validatedFields.error);
    return {
      errors: {
        username: errTree.properties?.username?.errors,
        password: errTree.properties?.password?.errors,
      },
    };
  }

  const verifiedResult = await invoke<AppError | null>("verify_user", validatedFields.data).catch(
    err => {
      return err as AppError;
    },
  );

  if (verifiedResult) return { errors: { other: [verifiedResult.message] } };

  const session = await invoke<Session | null>("get_session");

  if (!session) await createSession(validatedFields.data.username);

  redirect("/", RedirectType.replace);
}
