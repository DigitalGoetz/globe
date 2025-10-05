import { defineConfig } from "vite";
import type { UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

const hmr_target = process.env.HMR_TARGET || "localhost";

let config: UserConfig = {
  plugins: [react(), cesium()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      "/geoserver": {
        target: "http://localhost:7000",
        changeOrigin: true,
      },
    },
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify("/cesium"),
  },
  assetsInclude: ["**/*.gltf", "**/*.glb"],
};

if (hmr_target !== "localhost") {
  config = {
    plugins: [react(), cesium()],
    server: {
      host: true,
      allowedHosts: true,
      hmr: {
        protocol: "wss",
        clientPort: 443,
        path: "/@vite/client",
        host: hmr_target,
      },
      proxy: {
        "/geoserver": {
          target: "http://localhost:7000",
          changeOrigin: true,
        },
      },
    },
    define: {
      CESIUM_BASE_URL: JSON.stringify("/cesium"),
    },
    assetsInclude: ["**/*.gltf", "**/*.glb"],
  };
}

export default defineConfig(config);
