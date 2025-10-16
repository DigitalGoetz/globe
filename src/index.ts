import { ensureGlobeStyles } from "./styleManager";

ensureGlobeStyles();

export { Globe } from "./components/Globe";
export type {
  GlobeConfiguration,
  GlobeControls,
  GlobeProps,
  Trajectory,
  WMSConfig,
} from "./components/Globe";
