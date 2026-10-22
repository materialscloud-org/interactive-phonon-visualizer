import { SHARE_STORE_URL } from "../../shareStore";
import {
  DEFAULT_FORMAT,
  normaliseFormat,
  readPhonons,
  serializePhonons,
} from "./formats";
import { VisualizerProps } from "./formats";

// Link formats that load shared data:
//   ?<id>                          short form for our own kv-store, i.e.
//                                  {SHARE_STORE_URL}/api/shares/<id> (PhononVis)
//   ?fromURL=<url>[&format=<fmt>]  any backend serving JSON; same parameters
//                                  as seekpath-web's RemoteStructureLoader.
//                                  `fmt` is accepted as an alias of `format`;
//                                  the default format is PhononVis.
const FROM_URL_PARAM = "fromURL";
const FORMAT_PARAMS = ["format", "fmt"];
const KV_SHARES_PREFIX = `${SHARE_STORE_URL}/api/shares/`;
const SHORT_ID = /^[A-Za-z0-9_-]+$/;

/** Where shared data lives, and the format it is stored in. */
export interface SharedSource {
  url: string;
  format: string;
}

// A short id is a bare query key without a value: `?2c00ce92`.
const shortIdFrom = (params: URLSearchParams): string | undefined =>
  [...params].find(([key, value]) => value === "" && SHORT_ID.test(key))?.[0];

/** Shared data requested by the address bar, if any. */
export function getSharedSource(): SharedSource | null {
  const params = new URLSearchParams(window.location.search);
  const fromURL = params.get(FROM_URL_PARAM);
  if (fromURL) {
    const format = FORMAT_PARAMS.map((p) => params.get(p)).find(Boolean);
    return { url: fromURL, format: normaliseFormat(format) };
  }
  const id = shortIdFrom(params);
  return id ? { url: KV_SHARES_PREFIX + id, format: DEFAULT_FORMAT } : null;
}

/** App link that loads `source`. */
export function shareLinkFor({ url, format }: SharedSource): string {
  const base = window.location.origin + window.location.pathname;
  const id = url.startsWith(KV_SHARES_PREFIX)
    ? url.slice(KV_SHARES_PREFIX.length)
    : null;
  if (format === DEFAULT_FORMAT && id && SHORT_ID.test(id)) {
    return `${base}?${id}`;
  }
  const params = new URLSearchParams({ [FROM_URL_PARAM]: url });
  if (format !== DEFAULT_FORMAT) params.set(FORMAT_PARAMS[0], format);
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

/** Upload the phonon data (as PhononVis) to the kv-store. */
export async function uploadPhonons(
  data: VisualizerProps,
): Promise<SharedSource> {
  const body = serializePhonons(data);

  const res = await fetch(`${SHARE_STORE_URL}/api/shares`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (res.status === 413) {
    throw new Error(
      "this dataset is too large to share; use Download JSON instead",
    );
  }
  if (!res.ok) throw new Error(`share service returned ${res.status}`);

  const { id } = await res.json();
  return { url: KV_SHARES_PREFIX + id, format: DEFAULT_FORMAT };
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
