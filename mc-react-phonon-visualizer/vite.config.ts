import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { libInjectCss } from "vite-plugin-lib-inject-css";

import packageJson from "./package.json" with { type: "json" };

// peer deps and their subpaths (e.g. react/jsx-runtime) stay external
const external = Object.keys(packageJson.peerDependencies).map(
  (name) => new RegExp(`^${name}(/|$)`),
);

export default defineConfig({
  plugins: [react(), libInjectCss()],
  build: {
    lib: {
      entry: path.resolve(
        import.meta.dirname,
        "src/PhononVisualizer/index.tsx",
      ),
      fileName: "main",
      formats: ["es"],
    },
    rolldownOptions: { external },
  },
});
