import * as React from "react";
import type { Viewer as CesiumViewer } from "cesium";
import { Viewer as CesiumViewerCtor } from "cesium";
import type { GlobeControls } from "../types";

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}

function applyCreditsVisibility(
  viewer: CesiumViewer,
  show: boolean | undefined,
) {
  const creditContainer = viewer.cesiumWidget.creditContainer;
  if (creditContainer instanceof HTMLElement) {
    creditContainer.style.display = show ? "" : "none";
  }
}

export function useCesiumViewer(controls?: GlobeControls) {
  const cesiumContainerRef = React.useRef<HTMLDivElement>(null);
  const viewerRef = React.useRef<CesiumViewer | null>(null);
  const [viewerReady, setViewerReady] = React.useState(false);

  const resolvedControls = React.useMemo(
    () => ({
      baseLayerPicker: controls?.baseLayerPicker ?? true,
      animation: controls?.animation ?? true,
      timeline: controls?.timeline ?? true,
      geocoder: controls?.geocoder ?? true,
      homeButton: controls?.homeButton ?? true,
      fullscreenButton: controls?.fullscreenButton ?? true,
      sceneModePicker: controls?.sceneModePicker ?? true,
      navigationHelpButton: controls?.navigationHelpButton ?? true,
      infoBox: controls?.infoBox ?? true,
      selectionIndicator: controls?.selectionIndicator ?? true,
      shouldAnimate: controls?.shouldAnimate ?? false,
      showCredits: controls?.showCredits ?? false,
    }),
    [controls],
  );

  React.useEffect(() => {
    // Guard environment for SSR
    if (typeof window === "undefined") return;

    // Set Cesium base URL to local assets before creating viewer.
    // Host apps can override this globally if needed.
    window.CESIUM_BASE_URL = "/cesium-assets/Cesium/";

    if (cesiumContainerRef.current && !viewerRef.current) {
      viewerRef.current = new CesiumViewerCtor(cesiumContainerRef.current, {
        baseLayerPicker: resolvedControls.baseLayerPicker,
        animation: resolvedControls.animation,
        timeline: resolvedControls.timeline,
        geocoder: resolvedControls.geocoder,
        homeButton: resolvedControls.homeButton,
        fullscreenButton: resolvedControls.fullscreenButton,
        sceneModePicker: resolvedControls.sceneModePicker,
        navigationHelpButton: resolvedControls.navigationHelpButton,
        infoBox: resolvedControls.infoBox,
        selectionIndicator: resolvedControls.selectionIndicator,
        shouldAnimate: resolvedControls.shouldAnimate,
        terrainProvider: undefined,
      });

      applyCreditsVisibility(viewerRef.current, resolvedControls.showCredits);
      setViewerReady(true);
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      // Do not set state after unmount
    };
    // We only want to construct once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep credits visibility in sync with prop changes.
  React.useEffect(() => {
    if (viewerRef.current) {
      applyCreditsVisibility(viewerRef.current, resolvedControls.showCredits);
    }
  }, [resolvedControls.showCredits]);

  // Keep viewer sized to container changes.
  React.useEffect(() => {
    if (!viewerRef.current || !cesiumContainerRef.current) return;

    const Ctor: typeof ResizeObserver | null =
      typeof ResizeObserver !== "undefined" ? ResizeObserver : null;
    if (!Ctor) {
      viewerRef.current.resize();
      return;
    }
    const observer = new Ctor(() => viewerRef.current?.resize());
    observer.observe(cesiumContainerRef.current);
    return () => observer.disconnect();
  }, []);

  return { cesiumContainerRef, viewerRef, viewerReady } as const;
}
