import type { Entity } from "cesium";
import {
  WebMapServiceImageryProvider,
  Cartesian3,
  Color,
  Ion,
  Viewer as CesiumViewer,
  ImageryLayer,
  PolylineGraphics,
  ConstantPositionProperty,
} from "cesium";
import { useConfig } from "@web-components/configuration-provider";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ensureGlobeStyles } from "../styleManager";

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
  time?: number[];
  latitude: number[];
  longitude: number[];
  altitude: number[];
}

export interface GlobeProps {
  trajectory?: Trajectory | null;
  controls?: GlobeControls;
  enablePlayback?: boolean;
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

export function Globe({
  trajectory,
  controls,
  enablePlayback = false,
}: GlobeProps) {
  useEffect(() => {
    ensureGlobeStyles();
  }, []);

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
  const polylineEntityRef = useRef<Entity | null>(null);
  const playbackEntityRef = useRef<Entity | null>(null);
  const trajectoryPositionsRef = useRef<Cartesian3[]>([]);
  const timesRef = useRef<number[]>([]);
  const playbackTimeoutRef = useRef<number | null>(null);
  const playbackSpeedRef = useRef(1);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playbackAvailable, setPlaybackAvailable] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const isPlayingRef = useRef(false);

  const clearPlaybackTimer = () => {
    if (playbackTimeoutRef.current !== null) {
      window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
  };

  const setPlayingState = (playing: boolean) => {
    isPlayingRef.current = playing;
  };

  const updatePlaybackPosition = (nextPosition: Cartesian3 | undefined) => {
    const playbackEntity = playbackEntityRef.current;
    if (!playbackEntity || !nextPosition) {
      return;
    }

    const positionProperty = playbackEntity.position as {
      setValue?: (value: Cartesian3) => void;
    } | null;

    if (positionProperty && typeof positionProperty.setValue === "function") {
      positionProperty.setValue(nextPosition);
    } else {
      playbackEntity.position = new ConstantPositionProperty(nextPosition);
    }

    viewerRef.current?.scene.requestRender();
  };

  const schedulePlaybackFrom = (
    currentIndex: number,
    skipInitialDelay = false,
  ) => {
    if (!enablePlayback) {
      clearPlaybackTimer();
      setPlayingState(false);
      return;
    }

    const positions = trajectoryPositionsRef.current;
    const times = timesRef.current;
    if (!isPlayingRef.current) {
      clearPlaybackTimer();
      return;
    }

    if (positions.length < 2 || times.length < 2) {
      clearPlaybackTimer();
      setPlayingState(false);
      return;
    }

    const limit = Math.min(positions.length, times.length) - 1;
    if (currentIndex >= limit) {
      clearPlaybackTimer();
      setPlayingState(false);
      return;
    }

    const speedFactor =
      playbackSpeedRef.current > 0 ? playbackSpeedRef.current : 1;
    const baseDelay = Math.max(
      times[currentIndex + 1] - times[currentIndex],
      16,
    );
    const adjustedDelay = Math.max(baseDelay / speedFactor, 16);
    const timeoutDelay = skipInitialDelay ? 0 : adjustedDelay;

    clearPlaybackTimer();
    playbackTimeoutRef.current = window.setTimeout(() => {
      if (!isPlayingRef.current) {
        return;
      }

      const nextIndex = Math.min(currentIndex + 1, limit);
      setPlaybackIndex(nextIndex);

      if (nextIndex >= limit) {
        clearPlaybackTimer();
        setPlayingState(false);
        return;
      }

      schedulePlaybackFrom(nextIndex);
    }, timeoutDelay);
  };

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
      setViewerReady(true);
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      setViewerReady(false);
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

  useEffect(
    () => () => {
      clearPlaybackTimer();
    },
    [],
  );

  useEffect(() => {
    clearPlaybackTimer();

    if (!viewerRef.current || !viewerReady) {
      return;
    }

    viewerRef.current.entities.removeAll();
    viewerRef.current.scene.requestRender();
    polylineEntityRef.current = null;
    playbackEntityRef.current = null;
    trajectoryPositionsRef.current = [];
    timesRef.current = [];
    setPlaybackIndex(0);
    setPlayingState(false);
    setPlaybackAvailable(false);

    if (!trajectory) {
      return;
    }

    const positions = trajectory.latitude.map((lat, i) =>
      Cartesian3.fromDegrees(
        trajectory.longitude[i],
        lat,
        trajectory.altitude[i],
      ),
    );

    trajectoryPositionsRef.current = positions;

    const hasTimedTrajectory =
      enablePlayback &&
      Array.isArray(trajectory.time) &&
      trajectory.time.length === positions.length &&
      trajectory.time.length > 0;

    setPlaybackAvailable(hasTimedTrajectory);
    if (hasTimedTrajectory && trajectory.time) {
      timesRef.current = trajectory.time.slice();
    } else {
      timesRef.current = [];
    }

    if (positions.length === 0) {
      return;
    }

    const polylineEntity = viewerRef.current.entities.add({
      polyline: new PolylineGraphics({
        positions,
        width: 3,
        material: Color.ORANGERED,
      }),
    });

    polylineEntityRef.current = polylineEntity;

    void viewerRef.current.zoomTo(polylineEntity);

    if (!hasTimedTrajectory) {
      playbackEntityRef.current = null;
      viewerRef.current.scene.requestRender();
      return;
    }

    const initialPosition = positions[0];
    const playbackEntity = viewerRef.current.entities.add({
      position: new ConstantPositionProperty(initialPosition),
      point: {
        pixelSize: 10,
        color: Color.YELLOW,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
      },
    });

    playbackEntityRef.current = playbackEntity;

    viewerRef.current.scene.requestRender();
  }, [trajectory, enablePlayback, viewerReady, playbackAvailable]);

  useEffect(() => {
    if (!enablePlayback || !playbackAvailable) {
      return;
    }

    const playbackEntity = playbackEntityRef.current;
    const positions = trajectoryPositionsRef.current;

    if (!playbackEntity || positions.length === 0) {
      return;
    }

    const clampedIndex = Math.min(playbackIndex, positions.length - 1);
    const nextPosition = positions[clampedIndex];
    if (!nextPosition) {
      return;
    }

    updatePlaybackPosition(nextPosition);
  }, [playbackIndex, enablePlayback, playbackAvailable]);

  const handleReplay = () => {
    if (!enablePlayback || !playbackAvailable) {
      return;
    }

    const totalPositions = trajectoryPositionsRef.current.length;
    const totalTimes = timesRef.current.length;
    if (totalPositions === 0 || totalTimes === 0) {
      return;
    }

    clearPlaybackTimer();

    const totalSamples = Math.min(totalPositions, totalTimes);
    if (totalSamples <= 1) {
      const singlePosition = trajectoryPositionsRef.current[0];
      updatePlaybackPosition(singlePosition);
      setPlaybackIndex(0);
      setPlayingState(false);
      return;
    }

    const startPosition = trajectoryPositionsRef.current[0];
    updatePlaybackPosition(startPosition);

    setPlaybackIndex(0);
    setPlayingState(true);
    schedulePlaybackFrom(0, true);
  };

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!enablePlayback || !playbackAvailable) {
      return;
    }

    const { value } = event.target;
    const nextIndex = Number(value);
    if (Number.isNaN(nextIndex)) {
      return;
    }

    clearPlaybackTimer();
    setPlayingState(false);
    const sampleCount = trajectory?.time?.length ?? 0;
    const maxIndex = sampleCount > 0 ? sampleCount - 1 : 0;
    const clampedIndex = Math.max(0, Math.min(nextIndex, maxIndex));
    setPlaybackIndex(clampedIndex);
  };

  const handlePlaybackSpeedChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!enablePlayback) {
      return;
    }

    const rawValue = Number(event.target.value);
    const nextSpeed = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 1;
    playbackSpeedRef.current = nextSpeed;
    setPlaybackSpeed(nextSpeed);
    if (isPlayingRef.current) {
      clearPlaybackTimer();
      schedulePlaybackFrom(playbackIndex);
    }
  };

  const playbackSpeedOptions = [0.5, 1, 2, 10, 20, 50];
  const playbackSteps =
    enablePlayback && playbackAvailable && trajectory?.time
      ? trajectory.time.length
      : 0;
  const playbackDataValid =
    enablePlayback &&
    playbackAvailable &&
    !!trajectory &&
    playbackSteps > 0 &&
    trajectory.latitude.length === playbackSteps &&
    trajectory.longitude.length === playbackSteps &&
    trajectory.altitude.length === playbackSteps;
  const sliderMax = playbackDataValid ? playbackSteps - 1 : 0;
  const clampedSliderValue = playbackDataValid
    ? Math.min(playbackIndex, sliderMax)
    : 0;
  const sliderDisabled = !playbackDataValid || sliderMax === 0;
  const currentTimestamp = playbackDataValid
    ? trajectory?.time?.[clampedSliderValue]
    : undefined;

  const playbackSpeedSelectId = `${globeId.current}-playback-speed`;

  return (
    <div
      id={globeId.current}
      className="wc-globe-container"
      style={{ position: "relative" }}
    >
      <div ref={cesiumContainerRef} className="wc-globe-viewer" />
      {layers.length > 1 && (
        <div
          className="wc-globe-controls"
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 1000,
          }}
        >
          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            style={{
              backgroundColor: "#424242",
              color: "#ffffff",
              border: "1px solid #616161",
              borderRadius: "4px",
              padding: "8px 12px",
              fontSize: "14px",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {layers.map((layer) => (
              <option key={layer} value={layer}>
                {layer}
              </option>
            ))}
          </select>
        </div>
      )}
      {playbackDataValid && (
        <div className="wc-globe-playback">
          <button
            type="button"
            onClick={handleReplay}
            className="wc-globe-playback-button"
            disabled={sliderDisabled}
          >
            Replay
          </button>
          <label
            className="wc-globe-playback-speed"
            htmlFor={playbackSpeedSelectId}
          >
            <span>Speed</span>
            <select
              id={playbackSpeedSelectId}
              value={playbackSpeed}
              onChange={handlePlaybackSpeedChange}
              aria-label="Playback speed"
            >
              {playbackSpeedOptions.map((option) => (
                <option key={option} value={option}>
                  {Number.isInteger(option)
                    ? `${option}x`
                    : `${option.toFixed(1)}x`}
                </option>
              ))}
            </select>
          </label>
          <input
            className="wc-globe-playback-slider"
            type="range"
            min={0}
            max={sliderMax}
            step={1}
            value={clampedSliderValue}
            onChange={handleSliderChange}
            disabled={sliderDisabled}
            aria-label="Trajectory playback"
          />
          <span className="wc-globe-playback-time">
            {currentTimestamp
              ? new Date(currentTimestamp).toLocaleTimeString()
              : "--:--:--"}
          </span>
        </div>
      )}
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
