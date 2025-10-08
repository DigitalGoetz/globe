import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "Globe",
      fileName: "index",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "cesium",
        "resium",
        "@web-components/configuration-provider",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          cesium: "Cesium",
          resium: "Resium",
          "@web-components/configuration-provider": "ConfigurationProvider",
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ["cesium"],
  },
});
