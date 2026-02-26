import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// Change this if your backend uses a different port
const BACKEND = "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: BACKEND,
        changeOrigin: true,
        secure: false
      }
    }
  }
});