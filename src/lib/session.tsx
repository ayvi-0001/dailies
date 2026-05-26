import * as React from "react";

import * as jose from "jose";
import { Result, ResultAsync, errAsync, ok, okAsync } from "neverthrow";

import { invoke } from "@/lib/tauri";

const getEncodedKey = React.cache(async (): Promise<Uint8Array<ArrayBuffer>> => {
  const secretKey = await invoke<string>("get_jwt_secret");
  return new TextEncoder().encode(secretKey);
});

export async function encrypt(payload: { userName: string }): Promise<Result<string, Error>> {
  return ResultAsync.fromPromise(
    new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .sign(await getEncodedKey()),
    (e) => new Error(`${e}`),
  );
}

type JWTVerifyResult<T = jose.JWTPayload> = Result<jose.JWTVerifyResult<T>, Error>;

export async function decrypt<T extends jose.JWTPayload>(
  session: Result<string, Error>,
): Promise<ResultAsync<T, Error>> {
  if (session.isErr()) {
    return errAsync(session.error);
  }

  const encodedKey: Uint8Array<ArrayBuffer> = await getEncodedKey();

  const getJwtVerifyResult = async (): Promise<JWTVerifyResult> => {
    try {
      return okAsync(await jose.jwtVerify(session.value, encodedKey, { algorithms: ["HS256"] }));
    } catch {
      return errAsync(new Error("Failed to verify session"));
    }
  };

  const jwtVerifyResult: JWTVerifyResult = await getJwtVerifyResult();

  return jwtVerifyResult.andThen((t) => ok(t.payload as T));
}

export async function saveSession(userName: string, token: string): Promise<Result<string, Error>> {
  return ResultAsync.fromPromise(
    invoke<string>("save_session", { user: userName, session_id: token }),
    (e) => new Error(`${e}`),
  );
}

export async function createSession(userName: string): Promise<Result<string, Error>> {
  const session: Result<string, Error> = await encrypt({ userName: userName });

  return session.match(
    async (t) => await saveSession(userName, t),
    async (e) => { throw e; },
  );
}
