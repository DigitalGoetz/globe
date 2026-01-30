import { useConfig } from "@web-components/configuration-provider";
import { useEffect, useMemo, useState, useId } from "react";
import { ensureGlobeStyles } from "../styleManager";
import type { GlobeConfiguration, GlobeProps } from "../types";
import { useCesiumViewer } from "../hooks/useCesiumViewer";
import { useImageryLayer } from "../hooks/useImageryLayer";
import { useTrajectoryPlayback } from "../hooks/useTrajectoryPlayback";
import { KmlDataSource } from "cesium";

export function Globe({ trajectory, controls, kmlData }: GlobeProps) {
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
  const generatedId = useId();
  const globeId = useMemo(
    () => `globe-${generatedId.replace(/:/g, "-")}`,
    [generatedId],
  );
  const { cesiumContainerRef, viewerRef, viewerReady } =
    useCesiumViewer(controls);

  useImageryLayer(viewerRef, wmsEndpoint, selectedLayer);

  useEffect(() => {
    if (layers.length === 0) {
      setSelectedLayer("");
      return;
    }

    setSelectedLayer((current) =>
      layers.includes(current) ? current : layers[0],
    );
  }, [layers]);

  const {
    playbackAvailable,
    playbackSpeed,
    handleReplay,
    handleSliderChange,
    handlePlaybackSpeedChange,
    playbackSpeedOptions,
    sliderMax,
    clampedSliderValue,
    sliderDisabled,
    currentTimestamp,
  } = useTrajectoryPlayback(viewerRef, trajectory ?? null, viewerReady);

  const playbackSpeedSelectId = `${globeId}-playback-speed`;
  const showPlayback = playbackAvailable;

  if (viewerRef.current && kmlData) {
    const options = {
      camera: viewerRef.current?.camera,
      canvas: viewerRef.current?.canvas,
      screenOverlayContainr: viewerRef.current?.container,
    };
    viewerRef.current.dataSources.add(KmlDataSource.load(kmlData, options));
  }

  return (
    <div id={globeId} className="wc-globe-container">
      <div ref={cesiumContainerRef} className="wc-globe-viewer" />
      {layers.length > 1 && (
        <div className="wc-globe-controls">
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
      )}
      {showPlayback && (
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
