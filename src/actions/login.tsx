import { invoke } from "@tauri-apps/api/core";
import { RedirectType, redirect } from "next/navigation";
import { z } from "zod";

import type { Session } from "@/app/providers/user";
import { FormState } from "@/lib/forms";
import { createSession } from "@/lib/session";
import type { AppError } from "@/types/errors";
import { Option } from "@/types/option";

export const LoginFormSchema = z.object({
  username: z.string().trim(),
  password: z.string().trim(),
});

export default async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = LoginFormSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    const errTree = z.treeifyError(validatedFields.error);
    return {
      errors: {
        username: errTree.properties?.username?.errors ?? null,
        password: errTree.properties?.password?.errors ?? null,
      },
    };
  }

  const verifiedResult = await invoke<Option<AppError>>("verify_user", validatedFields.data).catch(
    err => {
      return err as AppError;
    },
  );

  if (verifiedResult) return { errors: { other: [verifiedResult.message] } };

  const session = await invoke<Option<Session>>("get_session");

  if (!session) await createSession(validatedFields.data.username);

  redirect("/", RedirectType.replace);
}
