import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";

export default {
  root: resolve(__dirname, "src"),
  build: {
    outDir: "../../dist/web",
    emptyOutDir: true,
  },
  server: {
    port: 8080,
  },
  preview: {
    port: 8080,
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        "name": "Box Search",
        "short_name": "BoxSearch",
        "description": "A small search engine",
        "handle_links": "auto",
        "theme_color": "#ffffff",
        "background_color": "#ffffff",
        "display": "standalone"
      }
    }),
  ],
};
