import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development the dashboard runs on :5173 and the API on :8000. The proxy makes the
// browser think both live on :5173, so we never fight CORS and the code is identical
// in dev and production.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
      "/demo": "http://localhost:8000",
      "/tracker.js": "http://localhost:8000",
    },
  },
});
