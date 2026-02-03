import type { Trajectory } from "./trajectory";
import type { GlobeControls } from "./globe_controls";
import type { Rectangle } from "cesium";

export interface GlobeProps {
  trajectory?: Trajectory | null;
  controls?: GlobeControls;
  kmlData?: Blob | null;
  czmlData?: unknown | null;
  focusRetangle?: Rectangle | null;
}
