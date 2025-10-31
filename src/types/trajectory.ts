export interface Trajectory {
  id?: number;
  time: number[];
  latitude: number[];
  longitude: number[];
  altitude: number[];
  segment_start: number;
  segment_end: number;
}
