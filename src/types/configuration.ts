export interface WMSConfig {
  url: string;
  layers: string[];
}

export interface GlobeConfiguration {
  mapServer: WMSConfig;
}
