import { Store, StoreOptions, load } from "@tauri-apps/plugin-store";
import { ResultAsync, err, ok } from "neverthrow";

export function loadStore(path: string, options?: Partial<StoreOptions>): ResultAsync<Store, Error> {
  return ResultAsync.fromPromise(
    load(path, { ...{ defaults: {}, autoSave: false }, ...options }),
    (e: unknown) => new Error(`${e}`),
  );
}

export function getStoreObject<T>(
  path: string,
  key: string,
  options?: Partial<StoreOptions>,
  saveFirst?: boolean,
): ResultAsync<T, Error> {
  const store: ResultAsync<Store, Error> = loadStore(path, options);
  return store
    .map<ResultAsync<T, Error>>(async (t): Promise<ResultAsync<T, Error>> => {
      if (saveFirst) await t.save();
      const value: Awaited<T> | undefined = await t.get<T>(key);
      if (value === undefined || value === null) {
        return err(new Error("Key not found in store."));
      } else {
        return ok(value);
      }
    })
    .andThen((t) => t);
}

export function setStoreObject<T>(
  path: string,
  key: string,
  value: T,
  options?: Partial<StoreOptions>,
): ResultAsync<Store, Error> {
  const store: ResultAsync<Store, Error> = loadStore(path, options);
  return store.map(async (t) => {
    await t.reload();
    await t.set(key, value);
    return t;
  });
}
