import { Result, err, ok } from "neverthrow";
import { z } from "zod";

import { User } from "@/app/providers/user";
import { FormState } from "@/lib/forms";
import { createSession } from "@/lib/session";

import { DecodedToken, getSessionDecoded } from "./session";
import { verifyUser } from "./user";

export const LoginFormSchema = z.object({
  username: z.string().trim(),
  password: z.string().trim(),
});

export default async function login(
  state: FormState,
  formData: FormData,
): Promise<Result<FormState, FormState>> {
  const validatedFields = LoginFormSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    const errTree = z.treeifyError(validatedFields.error);
    return err({
      errors: {
        username: errTree.properties?.username?.errors ?? null,
        password: errTree.properties?.password?.errors ?? null,
      },
    } as FormState);
  }

  const payload = {
    name: validatedFields.data.username,
    id: null,
    password: validatedFields.data.password,
  };

  const user: Result<User, Error> = await verifyUser(payload);

  if (user.isErr()) {
    return err({ errors: { other: [user.error.message] } } as FormState);
  }

  const session: Result<DecodedToken, Error> = await getSessionDecoded();

  if (session.isErr()) {
    const newSession: Result<string, Error> = await createSession(validatedFields.data.username);

    if (newSession.isErr()) {
      return err({ errors: { other: [newSession.error.message] } } as FormState);
    }
  }

  return ok(state);
}
