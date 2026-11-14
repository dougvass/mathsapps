import fs from "fs";
import path from "path";
import { unstable_cache } from "next/cache";
import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { blobConfigured, blobVersion, expireShared, MEMORY_CACHE_MS, OFFLINE_RETRY_MS, serverMemory, SHARED_CACHE_SECONDS, withTimeout } from "./store";

const WRITE_ATTEMPTS = 5;

// A JSON file kept in Vercel Blob (or a local file in development), with
// read-change-write updates that retry if someone else saved in between.
export function jsonFile<T>({
  blobPathname,
  localFile,
  empty,
  normalise,
  sharedTag,
}: {
  blobPathname: string;
  localFile: string;
  empty: () => Promise<T> | T;
  normalise: (raw: unknown) => T;
  // For data every page shows (like reviews): pages share one copy instead of
  // each reading storage. See readStore.
  sharedTag?: string;
}) {
  const localPath = path.join(process.cwd(), ".local-data", localFile);

  // One storage read of the latest saved file (null if there isn't one yet).
  async function fetchRaw(): Promise<unknown> {
    const result = await withTimeout(get(blobPathname, { access: "private", useCache: false }));
    return result && result.statusCode === 200 ? JSON.parse(await new Response(result.stream).text()) : null;
  }

  const fetchShared = sharedTag
    ? unstable_cache(fetchRaw, [blobPathname], { tags: [sharedTag], revalidate: SHARED_CACHE_SECONDS })
    : fetchRaw;

  function readLocal(): unknown {
    return fs.existsSync(localPath) ? JSON.parse(fs.readFileSync(localPath, "utf-8")) : null;
  }

  async function parse(raw: unknown): Promise<T> {
    return raw === null ? await empty() : normalise(raw);
  }

  const state = serverMemory(blobPathname, () => ({
    memory: null as { data: T; until: number } | null,
    reading: null as Promise<T> | null,
    // After a failed shared read, don't ask storage again for a while.
    failed: null as { error: unknown; until: number } | null,
  }));

  // A plain read (no ETag check, that's only for saving).
  function read(): Promise<T> {
    if (!blobConfigured()) return parse(readLocal());
    if (state.memory && Date.now() < state.memory.until) return Promise.resolve(state.memory.data);
    if (state.failed && Date.now() < state.failed.until) return Promise.reject(state.failed.error);
    state.reading ??= fetchShared()
      .catch((error) => {
        if (sharedTag) state.failed = { error, until: Date.now() + OFFLINE_RETRY_MS };
        throw error;
      })
      .then(parse)
      .then((data) => {
        if (sharedTag) state.memory = { data, until: Date.now() + MEMORY_CACHE_MS };
        return data;
      })
      .finally(() => {
        state.reading = null;
      });
    return state.reading;
  }

  function saved() {
    state.memory = null;
    state.failed = null;
    if (sharedTag) expireShared(sharedTag);
  }

  // `change` may run more than once, so it must not have side effects.
  async function update<R = void>(change: (data: T) => { data: T; result?: R }): Promise<R | undefined> {
    if (!blobConfigured()) {
      if (process.env.VERCEL) {
        throw new Error("Saving isn't set up: connect a Vercel Blob store to this project.");
      }
      const current = await parse(readLocal());
      const { data, result } = change(current);
      if (data !== current) {
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
        fs.writeFileSync(localPath, JSON.stringify(data, null, 2));
      }
      return result;
    }

    for (let attempt = 1; attempt <= WRITE_ATTEMPTS; attempt++) {
      // The ETag must come from the Blob API, read before the content (see blobVersion).
      const etag = await blobVersion(blobPathname);
      const current = await parse(etag ? await fetchRaw() : null);
      const { data, result } = change(current);
      // Nothing to change: don't spend a storage write.
      if (data === current) return result;
      try {
        await withTimeout(put(blobPathname, JSON.stringify(data, null, 2), {
          access: "private",
          addRandomSuffix: false,
          contentType: "application/json",
          // First write creates the file; later writes only succeed if nobody
          // changed it since we read it.
          // On the last try, overwrite anyway rather than lose the change.
          ...(attempt === WRITE_ATTEMPTS
            ? { allowOverwrite: true }
            : etag
              ? { allowOverwrite: true, ifMatch: etag }
              : { allowOverwrite: false }),
        }));
        saved();
        return result;
      } catch (error) {
        // Someone saved first (changed ETag, or created the file before us): retry.
        const conflict = error instanceof BlobPreconditionFailedError || !etag;
        if (!conflict || attempt === WRITE_ATTEMPTS) throw error;
      }
    }
  }

  return { read, update };
}
