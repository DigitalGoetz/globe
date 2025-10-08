import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "@web-components/configuration-provider";
import { Ion } from "cesium";
import App from "./App.tsx";

import "./main.scss";

Ion.defaultAccessToken = "";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider configUrl="/configuration.json">
      <App />
    </ConfigProvider>
  </StrictMode>,
);
