/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Which store Share links are saved to; see src/shareStore.ts. */
  readonly VITE_SHARE_STORE?: "dev" | "production";
}
