import { invoke } from "@tauri-apps/api/core";
import { RedirectType, redirect } from "next/navigation";
import { z } from "zod";

import type { User } from "@/app/providers/user";
import { FormState } from "@/lib/forms";
import { createSession } from "@/lib/session";

export const SignupFormSchema = z
  .object({
    username: z.string().min(3, { message: "Name must be at least 3 characters long." }).trim(),
    password: z
      .string()
      .min(8, { message: "Be at least 8 characters long" })
      .regex(/[a-zA-Z]/, { message: "Contain at least one letter." })
      .regex(/[0-9]/, { message: "Contain at least one number." })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Contain at least one special character.",
      })
      .trim(),
    confirmPassword: z.string().trim(),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "The passwords did not match",
        path: ["confirmPassword"],
      });
    }
  });

export default async function signup(_state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = SignupFormSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    const errTree = z.treeifyError(validatedFields.error);
    return {
      errors: {
        username: errTree.properties?.username?.errors ?? null,
        password: errTree.properties?.password?.errors ?? null,
        confirmPassword: errTree.properties?.confirmPassword?.errors ?? null,
      },
    };
  }

  const { username, password } = validatedFields.data;

  const user = await invoke<User | void>("create_user", {
    name: username,
    password: password,
  }).catch(console.error);

  if (!user?.name) return { errors: { other: ["invalid user"] } };

  try {
    await createSession(user.name);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { errors: { other: [error.message] } };
    } else {
      return { errors: { other: [`unknown error: ${error}`] } };
    }
  }

  redirect("/", RedirectType.replace);
}
