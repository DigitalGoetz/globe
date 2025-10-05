import { Viewer, ImageryLayer, Entity } from "resium";
import {
  WebMapServiceImageryProvider,
  Ion,
  SingleTileImageryProvider,
  Cartesian3,
  Math as CesiumMath,
  Color,
  Cartesian2,
  Cartographic,
} from "cesium";
import * as Cesium from "cesium";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  getGeoserverLayers,
  getGeoserverFeatureLayers,
} from "../utils/geoserver";

// Disable Cesium Ion
Ion.defaultAccessToken = "";

// Create a blank base layer to prevent default imagery requests
const blankImageryProvider = new SingleTileImageryProvider({
  url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  tileWidth: 256,
  tileHeight: 256,
});

// Memoize credit container to prevent recreation
const hiddenCreditContainer = document.createElement("div");

interface TrajectoryPoint {
  longitude: number;
  latitude: number;
  altitude?: number;
  timestamp?: string;
}

interface GlobeProps {
  geoserverUrl?: string;
  trajectoryData?: TrajectoryPoint[];
}

const getDisplayName = (layerName: string) => {
  const colonIndex = layerName.indexOf(":");
  return colonIndex !== -1 ? layerName.substring(colonIndex + 1) : layerName;
};

export function Globe({
  geoserverUrl = "/geoserver",
  trajectoryData = [],
}: GlobeProps) {
  const containerStyle = {
    position: "relative" as const,
    width: "100%",
    height: "100%",
  };
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [availableLayers, setAvailableLayers] = useState<string[]>([]);
  const [enabledFeatureLayers, setEnabledFeatureLayers] = useState<string[]>(
    [],
  );
  const [availableFeatureLayers, setAvailableFeatureLayers] = useState<
    string[]
  >([]);
  const [showFeatureDropdown, setShowFeatureDropdown] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<{
    layer: string;
    featureId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [is3D, setIs3D] = useState(true);

  const selectLayer = (layer: string) => {
    setSelectedLayer(layer);
  };

  const imageryProvidersRef = useRef<
    Record<string, WebMapServiceImageryProvider>
  >({});
  const viewerRef = useRef<any>(null);

  const setCenteredView = useCallback((camera: any) => {
    camera.setView({
      destination: Cartesian3.fromDegrees(0.0, 0.0, 20000000.0),
      orientation: {
        heading: 0.0,
        pitch: -CesiumMath.PI_OVER_TWO, // look straight down
        roll: 0.0,
      },
    });
  }, []);

  const onViewerMount = useCallback(
    (viewer: any) => {
      viewerRef.current = viewer;
      const { camera } = viewer.cesiumElement!;
      setCenteredView(camera);
    },
    [setCenteredView],
  );

  const handleViewerClick = useCallback(
    async (click: any) => {
      console.log("Viewer clicked, enabled layers:", enabledFeatureLayers);
      console.log("Click event:", click);

      // Close feature dropdown on any click
      setShowFeatureDropdown(false);

      if (enabledFeatureLayers.length === 0) {
        console.log("No enabled feature layers");
        return;
      }

      const clickPosition = click.position;
      console.log("Click position:", clickPosition);

      if (clickPosition && viewerRef.current) {
        const ellipsoidPosition =
          viewerRef.current.cesiumElement.camera.pickEllipsoid(clickPosition);
        console.log("Ellipsoid position:", ellipsoidPosition);

        if (ellipsoidPosition) {
          const cartographic =
            Cesium.Cartographic.fromCartesian(ellipsoidPosition);
          const longitude = Cesium.Math.toDegrees(cartographic.longitude);
          const latitude = Cesium.Math.toDegrees(cartographic.latitude);
          console.log("Coordinates:", { longitude, latitude });

          for (const layer of enabledFeatureLayers) {
            try {
              console.log(`Querying layer: ${layer}`);
              const response = await fetch(
                `${geoserverUrl}/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&LAYERS=${layer}&QUERY_LAYERS=${layer}&INFO_FORMAT=application/json&X=50&Y=50&WIDTH=100&HEIGHT=100&SRS=EPSG:4326&BBOX=${longitude - 0.001},${latitude - 0.001},${longitude + 0.001},${latitude + 0.001}`,
              );
              if (response.ok) {
                const data = await response.json();
                console.log(`GetFeatureInfo response for ${layer}:`, data);
                if (data.features && data.features.length > 0) {
                  const feature = data.features[0];
                  const featureId =
                    feature.id ||
                    feature.fid ||
                    feature.properties?.fid ||
                    feature.properties?.id ||
                    `${layer}.${Math.random().toString(36).substr(2, 9)}`;
                  console.log("Selected feature:", {
                    layer,
                    featureId,
                    feature,
                  });
                  setSelectedFeature({ layer, featureId });

                  return;
                }
              }
            } catch (error) {
              console.warn(`Failed to query feature for ${layer}:`, error);
            }
          }
          console.log("No features found, clearing selection");
          setSelectedFeature(null);
        }
      }
    },
    [geoserverUrl, enabledFeatureLayers],
  );

  const recenterEarth = useCallback(() => {
    if (viewerRef.current) {
      const { camera } = viewerRef.current.cesiumElement!;
      setCenteredView(camera);
    }
  }, [setCenteredView]);

  const imageryProviders = useMemo(() => {
    const providers: Record<string, WebMapServiceImageryProvider> = {};
    availableLayers.forEach((layer) => {
      if (!imageryProvidersRef.current[layer]) {
        imageryProvidersRef.current[layer] = new WebMapServiceImageryProvider({
          url: `${geoserverUrl}/wms`,
          layers: layer,
          parameters: {
            format: "image/png",
            transparent: true,
          },
        });
      }
      providers[layer] = imageryProvidersRef.current[layer];
    });
    return providers;
  }, [availableLayers, geoserverUrl]);

  const featureImageryProviders = useMemo(() => {
    const providers: Record<string, WebMapServiceImageryProvider> = {};
    availableFeatureLayers.forEach((layer) => {
      if (!imageryProvidersRef.current[`feature_${layer}`]) {
        imageryProvidersRef.current[`feature_${layer}`] =
          new WebMapServiceImageryProvider({
            url: `${geoserverUrl}/wms`,
            layers: layer,
            parameters: {
              format: "image/png",
              transparent: true,
            },
          });
      }
      providers[layer] = imageryProvidersRef.current[`feature_${layer}`];
    });
    return providers;
  }, [availableFeatureLayers, geoserverUrl]);

  const selectedFeatureProvider = useMemo(() => {
    if (!selectedFeature) return null;
    console.log("Creating selected feature provider for:", selectedFeature);
    return new WebMapServiceImageryProvider({
      url: `${geoserverUrl}/wms`,
      layers: selectedFeature.layer,
      parameters: {
        format: "image/png",
        transparent: true,
        featureid: selectedFeature.featureId,
        sld_body: `<?xml version="1.0" encoding="UTF-8"?><StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld"><NamedLayer><Name>${selectedFeature.layer}</Name><UserStyle><FeatureTypeStyle><Rule><PolygonSymbolizer><Fill><CssParameter name="fill">#00FF00</CssParameter><CssParameter name="fill-opacity">0.3</CssParameter></Fill><Stroke><CssParameter name="stroke">#00FF00</CssParameter><CssParameter name="stroke-width">3</CssParameter></Stroke></PolygonSymbolizer><LineSymbolizer><Stroke><CssParameter name="stroke">#00FF00</CssParameter><CssParameter name="stroke-width">3</CssParameter></Stroke></LineSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>`,
        _timestamp: Date.now(),
      },
    });
  }, [selectedFeature, geoserverUrl]);

  useEffect(() => {
    Promise.all([
      getGeoserverLayers(geoserverUrl),
      getGeoserverFeatureLayers(geoserverUrl),
    ])
      .then(([rasterLayers, featureLayers]) => {
        setAvailableLayers(rasterLayers);
        setAvailableFeatureLayers(featureLayers);
        if (rasterLayers.length === 0 && featureLayers.length === 0) {
          setError("No layers found");
        }
      })
      .catch((err) => {
        setError(`Failed to fetch layers: ${err.message}`);
        setSelectedLayer(null);
        setEnabledFeatureLayers([]);
      })
      .finally(() => setLoading(false));
  }, [geoserverUrl]);

  useEffect(() => {
    if (availableLayers.length > 0 && !selectedLayer) {
      setSelectedLayer(availableLayers[0]);
    }
  }, [availableLayers, selectedLayer]);

  useEffect(() => {
    if (
      selectedFeature &&
      !enabledFeatureLayers.includes(selectedFeature.layer)
    ) {
      setSelectedFeature(null);
    }
  }, [enabledFeatureLayers, selectedFeature]);

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ padding: "20px", color: "white" }}>Loading layers...</div>
      );
    }

    if (error) {
      return (
        <>
          <div style={{ padding: "20px", color: "white" }}>
            <div>Error: {error}</div>
            <div>Showing basic globe instead</div>
          </div>
          <Viewer
            baseLayerPicker={false}
            geocoder={false}
            homeButton={false}
            sceneModePicker={false}
            navigationHelpButton={false}
            animation={false}
            timeline={false}
            creditContainer={hiddenCreditContainer}
            imageryProvider={blankImageryProvider as any}
          />
        </>
      );
    }

    return (
      <>
        <Viewer
          ref={viewerRef}
          baseLayerPicker={false}
          geocoder={false}
          homeButton={false}
          sceneModePicker={false}
          navigationHelpButton={false}
          animation={false}
          timeline={false}
          infoBox={false}
          creditContainer={hiddenCreditContainer}
          imageryProvider={blankImageryProvider as any}
          scene3DOnly={false}
          sceneMode={is3D ? 3 : 2}
          selectionIndicator={false}
          onMount={onViewerMount}
          onClick={handleViewerClick}
        >
          {selectedLayer &&
            availableLayers.map((layer) =>
              selectedLayer === layer && imageryProviders[layer] ? (
                <ImageryLayer
                  key={layer}
                  imageryProvider={imageryProviders[layer]}
                />
              ) : null,
            )}
          {enabledFeatureLayers.map((layer) =>
            featureImageryProviders[layer] ? (
              <ImageryLayer
                key={`feature_${layer}`}
                imageryProvider={featureImageryProviders[layer]}
              />
            ) : null,
          )}
          {selectedFeatureProvider && (
            <ImageryLayer
              key={`selected_feature_${selectedFeature?.layer}_${selectedFeature?.featureId}`}
              imageryProvider={selectedFeatureProvider}
            />
          )}
          {trajectoryData.length > 0 && (
            <Entity
              polyline={{
                positions: trajectoryData.map((point) =>
                  Cartesian3.fromDegrees(
                    point.longitude,
                    point.latitude,
                    point.altitude || 10000,
                  ),
                ),
                width: 3,
                material: Color.YELLOW,
                clampToGround: false,
              }}
            />
          )}
        </Viewer>
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 1000,
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            onClick={() => setIs3D(!is3D)}
            style={{
              background: "#333333",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "10px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {is3D ? "2D" : "3D"}
          </button>
          <button
            onClick={recenterEarth}
            style={{
              background: "#333333",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "10px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            ⌂
          </button>
          {availableLayers.length > 0 && (
            <select
              value={selectedLayer || ""}
              onChange={(e) => selectLayer(e.target.value)}
              style={{
                background: "#333333",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "10px",
                borderRadius: "5px",
                fontSize: "14px",
                minWidth: "200px",
                cursor: "pointer",
              }}
            >
              <option value="">Raster Layers</option>
              {availableLayers.map((layer) => (
                <option
                  key={layer}
                  value={layer}
                  style={{ background: "#333333" }}
                >
                  {layer}
                </option>
              ))}
            </select>
          )}
          {availableFeatureLayers.length > 0 && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowFeatureDropdown(!showFeatureDropdown)}
                style={{
                  background: "#333333",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  padding: "10px",
                  borderRadius: "5px",
                  fontSize: "14px",
                  minWidth: "200px",
                  cursor: "pointer",
                }}
              >
                {enabledFeatureLayers.length > 0
                  ? `Features (${enabledFeatureLayers.length}): ${enabledFeatureLayers.map(getDisplayName).join(", ")}`
                  : "Feature Layers"}{" "}
                ▼
              </button>
              {showFeatureDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    background: "#333333",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: "5px",
                    marginTop: "2px",
                    zIndex: 1001,
                    maxHeight: "200px",
                    overflowY: "auto",
                    minWidth: "100%",
                    whiteSpace: "nowrap",
                  }}
                >
                  {availableFeatureLayers.map((layer) => (
                    <div key={layer} style={{ padding: "8px" }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          color: "white",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={enabledFeatureLayers.includes(layer)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEnabledFeatureLayers((prev) => [
                                ...prev,
                                layer,
                              ]);
                            } else {
                              setEnabledFeatureLayers((prev) =>
                                prev.filter((l) => l !== layer),
                              );
                            }
                          }}
                          style={{ marginRight: "8px" }}
                        />
                        {getDisplayName(layer)}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  return <div style={containerStyle}>{renderContent()}</div>;
}
