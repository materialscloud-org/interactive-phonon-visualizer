import { defineConfig, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // moyo-wasm (symmetry detection, used by matsci-parse) loads its .wasm via
  // import.meta.url, which dependency pre-bundling would break in dev.
  optimizeDeps: {
    exclude: ["@spglib/moyo-wasm"],
  },
  server: {
    port: 3000,
    // matsci-parse is linked from ../matsci-parse; allow serving its files
    // (e.g. the moyo .wasm) in dev.
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), "../matsci-parse"],
    },
  },
  base: "/",
});
