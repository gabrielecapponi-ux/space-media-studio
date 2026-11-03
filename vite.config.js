import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: "./",
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        atelier: fileURLToPath(new URL("./atelier.html", import.meta.url)),
      },
    },
  },
  server: {
    host: "127.0.0.1", port: 5174, strictPort: true,
    watch: { ignored: ["**/outputs/**", "**/mrsmeet/**"] },
  },
  preview: { host: "127.0.0.1", port: 5175, strictPort: true },
});
