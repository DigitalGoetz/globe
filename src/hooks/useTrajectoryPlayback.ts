import * as React from "react";
import type { Viewer as CesiumViewer, Entity } from "cesium";
import {
  Cartesian3,
  Color,
  ConstantPositionProperty,
  PolylineGraphics,
} from "cesium";
import type { Trajectory } from "../types";

type TimeoutHandle = ReturnType<typeof setTimeout> | null;

export function useTrajectoryPlayback(
  viewerRef: React.MutableRefObject<CesiumViewer | null>,
  trajectory: Trajectory | null | undefined,
  viewerReady: boolean,
) {
  const polylineEntityRef = React.useRef<Entity | null>(null);
  const playbackEntityRef = React.useRef<Entity | null>(null);
  const trajectoryPositionsRef = React.useRef<Cartesian3[]>([]);
  const timesRef = React.useRef<number[]>([]);
  const playbackTimeoutRef = React.useRef<TimeoutHandle>(null);

  const [playbackIndex, setPlaybackIndex] = React.useState(0);
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1);
  const [playbackAvailable, setPlaybackAvailable] = React.useState(false);
  const [playbackStatus, setPlaybackStatus] = React.useState<
    "stopped" | "playing" | "paused"
  >("stopped");
  const playbackStatusRef = React.useRef(playbackStatus);
  playbackStatusRef.current = playbackStatus;
  const playbackSpeedRef = React.useRef(playbackSpeed);
  playbackSpeedRef.current = playbackSpeed;

  const clearPlaybackTimer = () => {
    if (playbackTimeoutRef.current !== null) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
  };

  const updatePlaybackPosition = React.useCallback(
    (nextPosition: Cartesian3 | undefined) => {
      const playbackEntity = playbackEntityRef.current;
      if (!playbackEntity || !nextPosition) return;

      const positionProperty = playbackEntity.position as {
        setValue?: (value: Cartesian3) => void;
      } | null;

      if (positionProperty && typeof positionProperty.setValue === "function") {
        positionProperty.setValue(nextPosition);
      } else {
        playbackEntity.position = new ConstantPositionProperty(nextPosition);
      }
      viewerRef.current?.scene.requestRender();
    },
    [viewerRef],
  );

  const schedulePlaybackFrom = (
    currentIndex: number,
    skipInitialDelay = false,
  ) => {
    const positions = trajectoryPositionsRef.current;
    const times = timesRef.current;
    if (playbackStatusRef.current !== "playing") {
      clearPlaybackTimer();
      return;
    }

    if (positions.length < 2 || times.length < 2) {
      clearPlaybackTimer();
      setPlaybackStatus("stopped");
      return;
    }

    const limit = Math.min(positions.length, times.length) - 1;
    if (currentIndex >= limit) {
      clearPlaybackTimer();
      setPlaybackStatus("stopped");
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
    playbackTimeoutRef.current = setTimeout(() => {
      if (playbackStatusRef.current !== "playing") return;
      const nextIndex = Math.min(currentIndex + 1, limit);
      setPlaybackIndex(nextIndex);
      if (nextIndex >= limit) {
        clearPlaybackTimer();
        setPlaybackStatus("stopped");
        return;
      }
      schedulePlaybackFrom(nextIndex);
    }, timeoutDelay);
  };

  // Rebuild entities when viewer or trajectory changes
  React.useEffect(() => {
    clearPlaybackTimer();

    if (!viewerRef.current || !viewerReady) return;

    // Reset viewer entities and local refs
    viewerRef.current.entities.removeAll();
    viewerRef.current.scene.requestRender();
    polylineEntityRef.current = null;
    playbackEntityRef.current = null;
    trajectoryPositionsRef.current = [];
    timesRef.current = [];
    setPlaybackIndex(0);
    setPlaybackStatus("stopped");
    setPlaybackAvailable(false);

    if (!trajectory) return;

    const positions = trajectory.latitude.map((lat, i) =>
      Cartesian3.fromDegrees(
        trajectory.longitude[i],
        lat,
        trajectory.altitude[i],
      ),
    );
    trajectoryPositionsRef.current = positions;

    const hasTimedTrajectory =
      Array.isArray(trajectory.time) &&
      trajectory.time.length === positions.length &&
      trajectory.time.length > 0;

    setPlaybackAvailable(hasTimedTrajectory);
    timesRef.current =
      hasTimedTrajectory && trajectory.time ? trajectory.time.slice() : [];

    if (positions.length === 0) return;

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
  }, [viewerRef, trajectory, viewerReady, updatePlaybackPosition]);

  // When playback index changes, update point position
  React.useEffect(() => {
    if (!playbackAvailable) return;
    const positions = trajectoryPositionsRef.current;
    if (!playbackEntityRef.current || positions.length === 0) return;
    const clampedIndex = Math.min(playbackIndex, positions.length - 1);
    const nextPosition = positions[clampedIndex];
    updatePlaybackPosition(nextPosition);
  }, [playbackIndex, playbackAvailable, updatePlaybackPosition]);

  // Clear timers on unmount
  React.useEffect(() => () => clearPlaybackTimer(), []);

  const handlePlayPause = () => {
    if (!playbackAvailable) return;

    if (playbackStatus === "playing") {
      setPlaybackStatus("paused");
      clearPlaybackTimer();
    } else if (playbackStatus === "paused") {
      setPlaybackStatus("playing");
      playbackStatusRef.current = "playing";
      schedulePlaybackFrom(playbackIndex, true);
    } else {
      // 'stopped'
      setPlaybackIndex(0);
      updatePlaybackPosition(trajectoryPositionsRef.current[0]);
      setPlaybackStatus("playing");
      playbackStatusRef.current = "playing";
      schedulePlaybackFrom(0, true);
    }
  };

  const handleReset = () => {
    if (!playbackAvailable) return;
    clearPlaybackTimer();
    setPlaybackStatus("stopped");
    setPlaybackIndex(0);
    updatePlaybackPosition(trajectoryPositionsRef.current[0]);
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!playbackAvailable) return;
    const nextIndex = Number(event.target.value);
    if (Number.isNaN(nextIndex)) return;
    clearPlaybackTimer();
    setPlaybackStatus("paused");
    const sampleCount = timesRef.current.length;
    const maxIndex = sampleCount > 0 ? sampleCount - 1 : 0;
    const clampedIndex = Math.max(0, Math.min(nextIndex, maxIndex));
    setPlaybackIndex(clampedIndex);
  };

  const handlePlaybackSpeedChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    if (!playbackAvailable) return;
    const rawValue = Number(event.target.value);
    const nextSpeed = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 1;
    setPlaybackSpeed(nextSpeed);
    if (playbackStatusRef.current === "playing") {
      clearPlaybackTimer();
      schedulePlaybackFrom(playbackIndex);
    }
  };

  const playbackSpeedOptions = React.useMemo(() => [0.5, 1, 2, 10, 20, 50], []);
  const playbackSteps = playbackAvailable ? timesRef.current.length : 0;
  const playbackDataValid = playbackAvailable && playbackSteps > 0;
  const sliderMax = playbackDataValid ? playbackSteps - 1 : 0;
  const clampedSliderValue = playbackDataValid
    ? Math.min(playbackIndex, sliderMax)
    : 0;
  const sliderDisabled = !playbackDataValid || sliderMax === 0;
  const currentTimestamp = playbackDataValid
    ? timesRef.current[clampedSliderValue]
    : undefined;

  return {
    playbackAvailable,
    playbackIndex,
    setPlaybackIndex,
    playbackSpeed,
    setPlaybackSpeed,
    playbackSpeedOptions,
    handlePlayPause,
    handleReset,
    handleSliderChange,
    handlePlaybackSpeedChange,
    sliderMax,
    clampedSliderValue,
    sliderDisabled,
    currentTimestamp,
    playbackStatus,
  } as const;
}
