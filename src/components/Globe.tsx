import { Viewer, ImageryLayer } from "resium";
import { WebMapServiceImageryProvider, Ion, SingleTileImageryProvider } from "cesium";
import { useEffect, useState, useMemo, useRef } from "react";
import { getGeoserverLayers } from "../utils/geoserver";

// Disable Cesium Ion
Ion.defaultAccessToken = '';

// Create a blank base layer to prevent default imagery requests
const blankImageryProvider = new SingleTileImageryProvider({
  url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  tileWidth: 256,
  tileHeight: 256
});

// Memoize credit container to prevent recreation
const hiddenCreditContainer = document.createElement('div');

interface GlobeProps {
  geoserverUrl?: string;
}

export function Globe({ 
  geoserverUrl = "/geoserver" 
}: GlobeProps) {
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [availableLayers, setAvailableLayers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLayers, setShowLayers] = useState(false);

  const selectLayer = (layer: string) => {
    setSelectedLayer(layer);
  };

  const imageryProvidersRef = useRef<Record<string, WebMapServiceImageryProvider>>({});

  const imageryProviders = useMemo(() => {
    const providers: Record<string, WebMapServiceImageryProvider> = {};
    availableLayers.forEach(layer => {
      if (!imageryProvidersRef.current[layer]) {
        imageryProvidersRef.current[layer] = new WebMapServiceImageryProvider({
          url: `${geoserverUrl}/wms`,
          layers: layer,
          parameters: {
            format: "image/png",
            transparent: true
          }
        });
      }
      providers[layer] = imageryProvidersRef.current[layer];
    });
    return providers;
  }, [availableLayers, geoserverUrl]);

  useEffect(() => {
    getGeoserverLayers(geoserverUrl)
      .then(layers => {
        setAvailableLayers(layers);
        if (layers.length === 0) {
          setError("No layers found");
        }
      })
      .catch(err => {
        setError(`Failed to fetch layers: ${err.message}`);
        setSelectedLayer(null);
      })
      .finally(() => setLoading(false));
  }, [geoserverUrl]);

  useEffect(() => {
    if (availableLayers.length > 0 && !selectedLayer) {
      setSelectedLayer(availableLayers[0]);
    }
  }, [availableLayers, selectedLayer]);

  if (loading) {
    return <div style={{padding: '20px', color: 'white'}}>Loading layers...</div>;
  }

  if (error) {
    return (
      <div style={{padding: '20px', color: 'white'}}>
        <div>Error: {error}</div>
        <div>Showing basic globe instead</div>
        <Viewer 
          full
          baseLayerPicker={false}
          geocoder={false}
          homeButton={false}
          sceneModePicker={false}
          navigationHelpButton={false}
          animation={false}
          timeline={false}
          imageryProvider={blankImageryProvider}
          creditContainer={hiddenCreditContainer}
        />
      </div>
    );
  }

  if (!selectedLayer) {
    return (
      <Viewer 
        full
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        sceneModePicker={false}
        navigationHelpButton={false}
        animation={false}
        timeline={false}
        imageryProvider={blankImageryProvider}
        creditContainer={hiddenCreditContainer}
      />
    );
  }

  try {
    return (
      <Viewer 
        full
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        sceneModePicker={false}
        navigationHelpButton={false}
        animation={false}
        timeline={false}
        imageryProvider={blankImageryProvider}
        creditContainer={hiddenCreditContainer}
      >
        {availableLayers.map(layer => 
          selectedLayer === layer && imageryProviders[layer] ? (
            <ImageryLayer 
              key={layer}
              imageryProvider={imageryProviders[layer]} 
            />
          ) : null
        )}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000
        }}>
          <select 
            value={selectedLayer || ''}
            onChange={(e) => selectLayer(e.target.value)}
            style={{
              background: '#333333',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '10px',
              borderRadius: '5px',
              fontSize: '14px',
              minWidth: '200px',
              cursor: 'pointer'
            }}
          >
            {availableLayers.map(layer => (
              <option key={layer} value={layer} style={{ background: '#333333' }}>{layer}</option>
            ))}
          </select>
        </div>
      </Viewer>
    );
  } catch (err) {
    return (
      <div style={{padding: '20px', color: 'white'}}>
        <div>Error creating imagery provider: {(err as Error).message}</div>
        <Viewer 
          full
          baseLayerPicker={false}
          geocoder={false}
          homeButton={false}
          sceneModePicker={false}
          navigationHelpButton={false}
          animation={false}
          timeline={false}
          imageryProvider={blankImageryProvider}
          creditContainer={hiddenCreditContainer}
        />
      </div>
    );
  }
}