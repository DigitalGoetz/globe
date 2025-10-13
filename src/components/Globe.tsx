import { Viewer, ImageryLayer, Entity } from "resium";
import { WebMapServiceImageryProvider, Cartesian3, Color } from "cesium";
import { useConfig } from "@web-components/configuration-provider";
import { useEffect, useState, useRef } from "react";

interface WMSConfig {
  url: string;
  layers: string[];
}

interface GlobeConfiguration {
  mapServer: WMSConfig;
}

interface Trajectory {
  latitude: number[];
  longitude: number[];
  altitude: number[];
}

interface GlobeProps {
  trajectory?: Trajectory | null;
}

export function Globe({ trajectory }: GlobeProps) {
  const config = useConfig<GlobeConfiguration>();
  const wmsEndpoint = config.mapServer.url;
  const layers = config.mapServer.layers;

  const [selectedLayer, setSelectedLayer] = useState(
    config.mapServer.layers[0],
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const globeId = useRef(`globe-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const wmsProvider = wmsEndpoint
    ? new WebMapServiceImageryProvider({
        url: wmsEndpoint,
        layers: selectedLayer,
        parameters: {
          transparent: true,
          format: "image/png",
        },
      })
    : undefined;

  return (
    <div
      id={globeId.current}
      style={{
        overflow: "hidden",
        position: "relative",
        height: isFullscreen ? "90vh" : "100%",
        width: isFullscreen ? "90vw" : "100%",
        backgroundColor: "black",
        isolation: "isolate",
        contain: "layout style",
      }}
    >
      <style>{`
        #${globeId.current} .cesium-credit-logoContainer { display: none !important; }
        #${globeId.current} * {
          box-sizing: border-box;
        }
        #${globeId.current} select {
          all: unset;
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 1000;
          background-color: #424242;
          color: #ffffff;
          border: 1px solid #616161;
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 14px;
          font-family: inherit;
          cursor: pointer;
        }
        #${globeId.current} select:focus {
          outline: 2px solid #1976d2;
          outline-offset: 2px;
        }
      `}</style>
      <select
        value={selectedLayer}
        onChange={(e) => setSelectedLayer(e.target.value)}
      >
        {layers.map((layer) => (
          <option key={layer} value={layer}>
            {layer}
          </option>
        ))}
      </select>

      {wmsProvider && (
        <Viewer
          baseLayerPicker={false}
          geocoder={false}
          timeline={false}
          animation={false}
          fullscreenButton={true}
          style={{ height: "100%", width: "100%" }}
        >
          <ImageryLayer key={selectedLayer} imageryProvider={wmsProvider} />
          {trajectory && (
            <Entity
              polyline={{
                positions: trajectory.latitude.map((lat, i) =>
                  Cartesian3.fromDegrees(
                    trajectory.longitude[i],
                    lat,
                    trajectory.altitude[i],
                  ),
                ),
                width: 3,
                material: Color.ORANGERED,
              }}
            />
          )}
        </Viewer>
      )}
    </div>
  );
}
