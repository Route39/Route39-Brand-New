import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiTarget = env.VITE_API_URL ?? "http://127.0.0.1:3004/graphql";
  const wsTarget = env.VITE_WS_URL ?? apiTarget.replace(/^http/, "ws");
  const uploadsTarget = new URL(apiTarget).origin;
  const basePath = env.VITE_BASE_PATH ?? (mode === "production" ? "/admin/" : "/");

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "prompt",
        injectRegister: null,
        includeAssets: ["favicon.svg", "apple-touch-icon.png"],
        manifest: {
          name: "Route39 Admin",
          short_name: "Route39",
          description: "Operator console for the Route39 taxi platform.",
          theme_color: "#0ea5e9",
          background_color: "#0b1220",
          display: "standalone",
          orientation: "any",
          start_url: basePath,
          scope: basePath,
          icons: [
            { src: "icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icon-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "icon-maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
          navigateFallback: "index.html",
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.origin === self.location.origin && !url.pathname.startsWith("/api/"),
              handler: "StaleWhileRevalidate",
              options: { cacheName: "app-shell" },
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts",
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    base: basePath,
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      port: 4202,
      strictPort: false,
      proxy: {
        "/api/graphql": {
          target: apiTarget,
          changeOrigin: true,
          rewrite: () => "",
        },
        "/api/graphql-ws": {
          target: wsTarget,
          changeOrigin: true,
          ws: true,
          rewrite: () => "",
        },
        "/uploads": {
          target: uploadsTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
