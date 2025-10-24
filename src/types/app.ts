export interface Trajectory {
  id: string;
  time: number[];
  latitude: number[];
  longitude: number[];
  altitude: number[];
  mach: number[];
  dynamic_pressure: number[];
  segment_start: number;
  segment_end: number;
}
