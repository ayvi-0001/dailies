import * as React from "react";

import * as jose from "jose";
import { invoke } from "@tauri-apps/api/core";

const getEncodedKey = React.cache(async (): Promise<Uint8Array<ArrayBuffer>> => {
  const secretKey = await invoke<string>("get_jwt_secret");
  return new TextEncoder().encode(secretKey);
});

export async function encrypt(payload: { userName: string }): Promise<string> {
  const encodedKey = await getEncodedKey();
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(encodedKey);
}

export async function decrypt<T extends jose.JWTPayload>(
  session: string | null | undefined = "",
): Promise<T> {
  const encodedKey = await getEncodedKey();
  const { payload } = await jose.jwtVerify(session ?? "", encodedKey, { algorithms: ["HS256"] });
  if (!payload) throw new Error("Failed to verify session");
  return payload as T;
}

export async function createSession(userName: string): Promise<void> {
  const session: string = await encrypt({ userName: userName });
  await invoke("save_session", { user: userName, session_id: session });
}
