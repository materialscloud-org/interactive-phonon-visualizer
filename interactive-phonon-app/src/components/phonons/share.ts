import { KV_URL } from "../../shareStore";
import { DEFAULT_FORMAT, normaliseFormat, readPhonons } from "./formats";
import { VisualizerProps } from "./formats";

// Link formats that load shared data:
//   ?<id>                          short form for our own kv-store, i.e.
//                                  {KV_URL}/api/shares/<id> (PhononVis)
//   ?fromURL=<url>[&format=<fmt>][&tag=<name>]
//                                  any backend serving JSON; same parameters
//                                  as seekpath-web's RemoteStructureLoader.
//                                  The default format is PhononVis; `tag`
//                                  names the data in the history.
const FROM_URL_PARAM = "fromURL";
const FORMAT_PARAM = "format";
const TAG_PARAM = "tag";
const KV_SHARES_PREFIX = `${KV_URL}/api/shares/`;
const SHORT_ID = /^[A-Za-z0-9_-]+$/;

/** Where shared data lives, and the format it is stored in. */
export interface SharedSource {
  url: string;
  format: string;
  /** Name for the data, from `?tag=` (only for ?fromURL= links). */
  tag?: string;
}

// A short id is a bare query key without a value: `?2c00ce92`.
const shortIdFrom = (params: URLSearchParams): string | undefined =>
  [...params].find(([key, value]) => value === "" && SHORT_ID.test(key))?.[0];

/** Shared data requested by the address bar, if any. */
export function getSharedSource(): SharedSource | null {
  const params = new URLSearchParams(window.location.search);
  const fromURL = params.get(FROM_URL_PARAM);
  if (fromURL) {
    return {
      url: fromURL,
      format: normaliseFormat(params.get(FORMAT_PARAM)),
      tag: params.get(TAG_PARAM) || undefined,
    };
  }
  const id = shortIdFrom(params);
  return id ? { url: KV_SHARES_PREFIX + id, format: DEFAULT_FORMAT } : null;
}

/** App link that loads `source`. */
export function shareLinkFor({ url, format, tag }: SharedSource): string {
  const base = window.location.origin + window.location.pathname;
  const id = url.startsWith(KV_SHARES_PREFIX)
    ? url.slice(KV_SHARES_PREFIX.length)
    : null;
  if (format === DEFAULT_FORMAT && id && SHORT_ID.test(id)) {
    return `${base}?${id}`;
  }
  const params = new URLSearchParams({ [FROM_URL_PARAM]: url });
  if (format !== DEFAULT_FORMAT) params.set(FORMAT_PARAM, format);
  if (tag) params.set(TAG_PARAM, tag);
  return `${base}?${params}`;
}

/**
 * Keep the address bar in sync with the data on screen: its share link when
 * it has a source, otherwise the plain app URL.
 */
export function syncAddressBar(source?: SharedSource) {
  const link = source
    ? shareLinkFor(source)
    : window.location.origin + window.location.pathname;
  window.history.replaceState(null, "", link + window.location.hash);
}

/** Source of data shared to our kv-store as `id` (see McShareButton). */
export const kvSource = (id: string): SharedSource => ({
  url: KV_SHARES_PREFIX + id,
  format: DEFAULT_FORMAT,
});

/**
 * kv-store id of a source, if it is one of our own share links. Sharing
 * data from anywhere else (e.g. ?fromURL=) uploads a copy instead.
 */
export function kvShareId(source?: SharedSource): string | undefined {
  if (!source || source.format !== DEFAULT_FORMAT) return undefined;
  if (!source.url.startsWith(KV_SHARES_PREFIX)) return undefined;
  const id = source.url.slice(KV_SHARES_PREFIX.length);
  return SHORT_ID.test(id) ? id : undefined;
}

/** Fetch shared data and convert it to PhononVis. */
export async function fetchPhonons({
  url,
  format,
}: SharedSource): Promise<VisualizerProps> {
  const res = await fetch(url);
  if (res.status === 404) {
    throw new Error("shared data not found (links expire after 30 days)");
  }
  if (!res.ok) throw new Error(`could not load shared data (${res.status})`);
  return readPhonons(await res.json(), format);
}
