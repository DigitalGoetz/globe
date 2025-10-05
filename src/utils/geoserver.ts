export async function getGeoserverLayers(baseUrl: string): Promise<string[]> {
  const response = await fetch(`${baseUrl}/rest/layers.json`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();

  const layers = data.layers?.layer || [];
  const rasterLayers: string[] = [];

  for (const layer of layers) {
    try {
      const layerResponse = await fetch(
        `${baseUrl}/rest/layers/${layer.name}.json`,
      );
      if (layerResponse.ok) {
        const layerData = await layerResponse.json();
        const resourceType = layerData.layer?.resource?.["@class"];
        if (resourceType === "coverage" || resourceType === "coverageStore") {
          rasterLayers.push(layer.name);
        }
      }
    } catch (error) {
      console.warn(`Failed to check layer type for ${layer.name}:`, error);
    }
  }

  return rasterLayers;
}

export async function getGeoserverFeatureLayers(
  baseUrl: string,
): Promise<string[]> {
  const response = await fetch(`${baseUrl}/rest/layers.json`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();

  const layers = data.layers?.layer || [];
  const featureLayers: string[] = [];

  for (const layer of layers) {
    try {
      const layerResponse = await fetch(
        `${baseUrl}/rest/layers/${layer.name}.json`,
      );
      if (layerResponse.ok) {
        const layerData = await layerResponse.json();
        const resourceType = layerData.layer?.resource?.["@class"];
        if (resourceType === "featureType") {
          featureLayers.push(layer.name);
        }
      }
    } catch (error) {
      console.warn(`Failed to check layer type for ${layer.name}:`, error);
    }
  }

  return featureLayers;
}
