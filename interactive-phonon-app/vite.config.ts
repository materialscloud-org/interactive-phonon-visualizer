import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // moyo-wasm (symmetry detection, used by matsci-parse) loads its .wasm via
  // import.meta.url, which dependency pre-bundling would break in dev.
  optimizeDeps: {
    exclude: ["@spglib/moyo-wasm"],
  },
  server: {
    port: 3000,
  },
  base: "/",
});
