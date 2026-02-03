export interface Trajectory {
  id?: number | string;
  time: number[];
  latitude: number[];
  longitude: number[];
  altitude: number[];
  segment_start: number;
  segment_end: number;
}
