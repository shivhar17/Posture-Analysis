import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true
      },
      "/analyze-image": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true
      },
      "/analyze-video": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true
      },
      "/analysis-history": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true
      },
      "/analysis-report": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true
      }
    }
  }
})
