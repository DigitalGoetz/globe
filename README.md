# Globe Component

A React component for displaying 3D globe visualization with WMS layer support and trajectory rendering using Cesium.

## Requirements

- Node.js 20.19+ or 22.12+
- React 18+

## Installation

```bash
npm install @web-components/globe
```

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
