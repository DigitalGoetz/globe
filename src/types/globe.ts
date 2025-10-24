import type { Trajectory } from "./trajectory";
import type { GlobeControls } from "./controls";

export interface GlobeProps {
  trajectory?: Trajectory | null;
  controls?: GlobeControls;
  enablePlayback?: boolean;
}
