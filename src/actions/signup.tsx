import { Result, err, ok } from "neverthrow";
import { z } from "zod";

import { FormState } from "@/lib/forms";
import { createSession } from "@/lib/session";

import { createUser } from "./user";

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

export default async function signup(
  state: FormState,
  formData: FormData,
): Promise<Result<FormState, FormState>> {
  const validatedFields = SignupFormSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    const errTree = z.treeifyError(validatedFields.error);
    return err({
      errors: {
        username: errTree.properties?.username?.errors ?? null,
        password: errTree.properties?.password?.errors ?? null,
        confirmPassword: errTree.properties?.confirmPassword?.errors ?? null,
      },
    } as FormState);
  }

  const { username, password } = validatedFields.data;

  const user = await createUser({
    name: username,
    password: password,
  });

  if (user.isErr()) {
    return err({ errors: { other: [user.error.message] } });
  }

  const session = await createSession(user.value.name);

  return session.match(
    (_) => ok(state),
    (e) => err({ errors: { other: [e.message] } }),
  );
}
