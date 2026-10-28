import { KV_STORE_URL } from "mc-react-library";

// kv-store for share links. .env.development points `npm run dev` at the dev
// store; unset (production builds) means the Materials Cloud production store.
export const KV_URL: string = import.meta.env.VITE_KV_URL || KV_STORE_URL;
