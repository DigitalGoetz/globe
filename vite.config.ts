import { defineConfig } from "vite";
import type { UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

const hmr_target = process.env.HMR_TARGET || "localhost";

const commonConfigEntries = {
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      react: "react",
      "react-dom": "react-dom",
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    force: true,
  },
  assetsInclude: ["**/*.wasm", "**/*.js"],
}

let config: UserConfig = {
  plugins: [react(), cesium()],
  ...commonConfigEntries,
  server: {
    host: true,
    allowedHosts: true,
    fs: {
      allow: [".."],
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify("/cesium"),
  },
  
};

if (hmr_target !== "localhost") {
  config = {
    plugins: [react(), cesium()],
    ...commonConfigEntries,
    server: {
      host: true,
      allowedHosts: true,
      fs: {
        allow: [".."],
      },
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
      hmr: {
        protocol: "wss",
        clientPort: 443,
        path: "/@vite/client",
        host: hmr_target,
      },
    },
  };
}

export default defineConfig(config);
