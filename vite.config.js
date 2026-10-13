import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    host: "127.0.0.1", port: 5174, strictPort: true,
    watch: { ignored: ["**/outputs/**", "**/mrsmeet/**"] },
  },
  preview: { host: "127.0.0.1", port: 5175, strictPort: true },
});
