# Globe Component

A React component for displaying 3D globe visualization with WMS layer support and trajectory rendering using Cesium.

## Requirements

- Node.js 20.19+ or 22.12+
- React 18+

## Installation

```bash
npm install @web-components/globe
```

During installation, the package copies the Cesium asset bundle into your application's `public/cesium-assets` directory so it can be served at runtime. Set the environment variable `GLOBE_SKIP_ASSET_COPY=true` if you prefer to manage these files manually.

## Configuration

The Globe component requires configuration through the `@web-components/configuration-provider`. Create a configuration file:

```json
{
  "mapServer": {
    "url": "https://your-geoserver.com/geoserver/wms",
    "layers": ["layer1:name", "layer2:name"]
  }
}
```

## Cesium Assets

The Globe component expects Cesium static assets to be available under `/cesium-assets` at runtime. After `npm install`, the package copies its bundled assets into `public/cesium-assets` in the installing project. If you customize the destination, update your web server so the assets are served from the same path, or opt out of the automatic copy by setting `GLOBE_SKIP_ASSET_COPY=true` before installation and handling the files yourself.

## Basic Usage

```tsx
import { Globe } from '@web-components/globe';
import { ConfigProvider } from '@web-components/configuration-provider';

function App() {
  return (
    <ConfigProvider configUrl="/configuration.json">
      <Globe />
    </ConfigProvider>
  );
}
```

## Styling

The Globe package now injects its required styles (including Cesium widget styles) the first time you import it, so you no longer need a separate `@web-components/globe/style.css` import. The bundled stylesheet is still published for backward compatibility but is entirely optional.

## Development

```bash
# Start development server with API
npm run dev:full

# Run tests
npm test

# Build library
npm run build:lib
```

## API Reference

### Globe Props

| Prop | Type | Description |
|------|------|-------------|
| `trajectory` | `Trajectory \| null` | Optional trajectory data to display |

### Trajectory Interface

```typescript
interface Trajectory {
  latitude: number[];
  longitude: number[];
  altitude: number[];
  ...
}
```
