// Key-value store for Share links, chosen with VITE_SHARE_STORE (see README).
// TODO: bubble this up to mc-react-library.
export const SHARE_STORES = {
  dev: "https://kv-store.dev.materialscloud.org",
  production: "https://kv-store.materialscloud.org",
};

export const SHARE_STORE_NAME = (import.meta.env.VITE_SHARE_STORE ||
  "dev") as keyof typeof SHARE_STORES;

export const SHARE_STORE_URL = SHARE_STORES[SHARE_STORE_NAME];

if (!SHARE_STORE_URL) {
  throw new Error(`Unknown VITE_SHARE_STORE '${SHARE_STORE_NAME}'`);
}
