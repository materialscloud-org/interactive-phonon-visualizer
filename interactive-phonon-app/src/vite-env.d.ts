/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** kv-store that Share links are saved to; see src/shareStore.ts. */
  readonly VITE_KV_URL?: string;
}
