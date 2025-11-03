import * as React from "react";
import { WebMapServiceImageryProvider, ImageryLayer } from "cesium";
import type { Viewer as CesiumViewer } from "cesium";

export function useImageryLayer(
  viewerRef: React.MutableRefObject<CesiumViewer | null>,
  wmsEndpoint: string | undefined,
  selectedLayer: string | undefined,
) {
  React.useEffect(() => {
    const viewer = viewerRef.current;
    if (viewer && wmsEndpoint && selectedLayer) {
      const wmsProvider = new WebMapServiceImageryProvider({
        url: wmsEndpoint,
        layers: selectedLayer,
        parameters: { transparent: true, format: "image/png" },
      });
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.add(new ImageryLayer(wmsProvider));
    }
  }, [viewerRef, wmsEndpoint, selectedLayer]);
}
