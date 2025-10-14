import {
  WebMapServiceImageryProvider,
  Cartesian3,
  Color,
  Ion,
  Viewer as CesiumViewer,
  ImageryLayer,
  PolylineGraphics,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { useConfig } from "@web-components/configuration-provider";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Globe.module.css";

Ion.defaultAccessToken = "";

// Set Cesium base URL to local assets
declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}

window.CESIUM_BASE_URL = "/cesium-assets/Cesium/";

export interface WMSConfig {
  url: string;
  layers: string[];
}

export interface GlobeConfiguration {
  mapServer: WMSConfig;
}

export interface Trajectory {
  latitude: number[];
  longitude: number[];
  altitude: number[];
}

export interface GlobeProps {
  trajectory?: Trajectory | null;
  controls?: GlobeControls;
}

export interface GlobeControls {
  baseLayerPicker?: boolean;
  animation?: boolean;
  timeline?: boolean;
  geocoder?: boolean;
  homeButton?: boolean;
  fullscreenButton?: boolean;
  sceneModePicker?: boolean;
  navigationHelpButton?: boolean;
  infoBox?: boolean;
  selectionIndicator?: boolean;
  shouldAnimate?: boolean;
  showCredits?: boolean;
}

export function Globe({ trajectory, controls }: GlobeProps) {
  const config = useConfig<GlobeConfiguration>();
  const mapServerConfig = config?.mapServer;
  const layers = useMemo(
    () => mapServerConfig?.layers ?? [],
    [mapServerConfig],
  );
  const wmsEndpoint = mapServerConfig?.url ?? "";

  const [selectedLayer, setSelectedLayer] = useState(layers[0] ?? "");
  const globeId = useRef(`globe-${Math.random().toString(36).substr(2, 9)}`);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<GlobeControls>(controls ?? {});

  useEffect(() => {
    if (layers.length === 0) {
      setSelectedLayer("");
      return;
    }

    setSelectedLayer((current) =>
      layers.includes(current) ? current : layers[0],
    );
  }, [layers]);

  useEffect(() => {
    // Set Cesium base URL before creating viewer
    window.CESIUM_BASE_URL = "/cesium-assets/Cesium/";

    if (cesiumContainerRef.current && !viewerRef.current) {
      const resolvedControls = {
        baseLayerPicker: controlsRef.current.baseLayerPicker ?? true,
        animation: controlsRef.current.animation ?? true,
        timeline: controlsRef.current.timeline ?? true,
        geocoder: controlsRef.current.geocoder ?? true,
        homeButton: controlsRef.current.homeButton ?? true,
        fullscreenButton: controlsRef.current.fullscreenButton ?? true,
        sceneModePicker: controlsRef.current.sceneModePicker ?? true,
        navigationHelpButton: controlsRef.current.navigationHelpButton ?? true,
        infoBox: controlsRef.current.infoBox ?? true,
        selectionIndicator: controlsRef.current.selectionIndicator ?? true,
        shouldAnimate: controlsRef.current.shouldAnimate ?? false,
      };

      viewerRef.current = new CesiumViewer(cesiumContainerRef.current, {
        ...resolvedControls,
        terrainProvider: undefined,
      });

      applyCreditsVisibility(viewerRef.current, controlsRef.current);
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (viewerRef.current && wmsEndpoint && selectedLayer) {
      const wmsProvider = new WebMapServiceImageryProvider({
        url: wmsEndpoint,
        layers: selectedLayer,
        parameters: {
          transparent: true,
          format: "image/png",
        },
      });

      viewerRef.current.imageryLayers.removeAll();
      viewerRef.current.imageryLayers.add(new ImageryLayer(wmsProvider));
    }
  }, [selectedLayer, wmsEndpoint]);

  useEffect(() => {
    if (viewerRef.current && trajectory) {
      viewerRef.current.entities.removeAll();

      const positions = trajectory.latitude.map((lat, i) =>
        Cartesian3.fromDegrees(
          trajectory.longitude[i],
          lat,
          trajectory.altitude[i],
        ),
      );

      viewerRef.current.entities.add({
        polyline: new PolylineGraphics({
          positions,
          width: 3,
          material: Color.ORANGERED,
        }),
      });
    }
  }, [trajectory]);

  useEffect(() => {
    if (!viewerRef.current || !cesiumContainerRef.current) return;

    const resizeObserverCtor =
      typeof ResizeObserver !== "undefined" ? ResizeObserver : null;

    if (!resizeObserverCtor) {
      viewerRef.current.resize();
      return;
    }

    const observer = new resizeObserverCtor(() => {
      viewerRef.current?.resize();
    });

    observer.observe(cesiumContainerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    controlsRef.current = controls ?? {};
    if (viewerRef.current) {
      applyCreditsVisibility(viewerRef.current, controlsRef.current);
    }
  }, [controls]);

  return (
    <div id={globeId.current} className={styles.container}>
      <div className={styles.controls}>
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
      </div>
      <div ref={cesiumContainerRef} className={styles.viewer} />
    </div>
  );
}

function applyCreditsVisibility(
  viewer: CesiumViewer,
  controlOverrides: GlobeControls,
) {
  const showCredits = controlOverrides.showCredits ?? false;
  const creditContainer = viewer.cesiumWidget.creditContainer;
  if (creditContainer instanceof HTMLElement) {
    creditContainer.style.display = showCredits ? "" : "none";
  }
}
