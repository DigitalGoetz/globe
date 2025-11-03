import type { Trajectory } from "./trajectory";
import type { GlobeControls } from "./globe_controls";

export interface GlobeProps {
  trajectory?: Trajectory | null;
  controls?: GlobeControls;
}
