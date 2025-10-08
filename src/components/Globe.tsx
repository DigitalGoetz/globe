import { Viewer, ImageryLayer, Entity } from "resium";
import { WebMapServiceImageryProvider, Cartesian3, Color } from "cesium";
import { useConfig } from "@web-components/configuration-provider";
import { useEffect, useState } from "react";

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
      style={{
        overflow: "hidden",
        position: "relative",
        height: isFullscreen ? "90vh" : "100%",
        width: isFullscreen ? "90vw" : "100%",
        backgroundColor: "black",
      }}
    >
      <style>{`.cesium-credit-logoContainer { display: none !important; }`}</style>
      <select
        value={selectedLayer}
        onChange={(e) => setSelectedLayer(e.target.value)}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1000,
          backgroundColor: "#424242",
          color: "#ffffff",
          border: "1px solid #616161",
          borderRadius: "4px",
          padding: "8px 12px",
          fontSize: "14px",
          outline: "none",
        }}
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
