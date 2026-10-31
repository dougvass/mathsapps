import fs from "fs";
import path from "path";
import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { blobConfigured, blobVersion, withTimeout } from "./store";

const WRITE_ATTEMPTS = 5;

// A JSON file kept in Vercel Blob (or a local file in development), with
// read-change-write updates that retry if someone else saved in between.
export function jsonFile<T>({
  blobPathname,
  localFile,
  empty,
  normalise,
  cacheMs = 0,
}: {
  blobPathname: string;
  localFile: string;
  empty: () => Promise<T> | T;
  normalise: (raw: unknown) => T;
  // Reuse a read for this long (for data every page shows, like reviews).
  cacheMs?: number;
}) {
  const localPath = path.join(process.cwd(), ".local-data", localFile);

  async function load(): Promise<{ data: T; etag: string | null }> {
    if (!blobConfigured()) {
      if (!fs.existsSync(localPath)) return { data: await empty(), etag: null };
      return { data: normalise(JSON.parse(fs.readFileSync(localPath, "utf-8"))), etag: null };
    }
    // See blobVersion: the ETag must come from the Blob API, read before the content.
    const etag = await blobVersion(blobPathname);
    const result = etag ? await withTimeout(get(blobPathname, { access: "private", useCache: false })) : null;
    if (etag && result && result.statusCode === 200) {
      const text = await new Response(result.stream).text();
      return { data: normalise(JSON.parse(text)), etag };
    }
    return { data: await empty(), etag: null };
  }

  let cached: { data: T; at: number } | null = null;

  // A plain read: one storage request (no ETag check, that's only for saving).
  async function read(): Promise<T> {
    if (cached && Date.now() - cached.at < cacheMs) return cached.data;
    let data: T;
    if (!blobConfigured()) {
      data = (await load()).data;
    } else {
      const result = await withTimeout(get(blobPathname, { access: "private", useCache: false }));
      data = result && result.statusCode === 200 ? normalise(JSON.parse(await new Response(result.stream).text())) : await empty();
    }
    if (cacheMs > 0) cached = { data, at: Date.now() };
    return data;
  }

  // `change` may run more than once, so it must not have side effects.
  async function update<R = void>(change: (data: T) => { data: T; result?: R }): Promise<R | undefined> {
    if (!blobConfigured()) {
      if (process.env.VERCEL) {
        throw new Error("Saving isn't set up: connect a Vercel Blob store to this project.");
      }
      const { data, result } = change((await load()).data);
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, JSON.stringify(data, null, 2));
      cached = null;
      return result;
    }

    for (let attempt = 1; attempt <= WRITE_ATTEMPTS; attempt++) {
      const { data: current, etag } = await load();
      const { data, result } = change(current);
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
        cached = null;
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
