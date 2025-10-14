import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../App";

// Mock fetch for trajectory API
global.fetch = vi.fn();

// Mock configuration provider
vi.mock("@web-components/configuration-provider", () => ({
  useConfig: () => ({
    mapServer: { url: "http://test-wms.com", layers: ["test-layer"] },
  }),
}));

const mockTrajectory = {
  id: "test-1",
  time: [1703097600000, 1703097610000],
  latitude: [28.5721, 28.8234],
  longitude: [-80.648, -79.5967],
  altitude: [0, 5000],
  mach: [0.0, 0.5],
  dynamic_pressure: [0, 200],
  segment_start: 1703097600000,
  segment_end: 1703097610000,
};

// Mock Cesium
vi.mock("cesium", () => ({
  Ion: {
    defaultAccessToken: "",
  },
  Viewer: vi.fn().mockImplementation(() => ({
    imageryLayers: {
      removeAll: vi.fn(),
      add: vi.fn(),
    },
    entities: {
      removeAll: vi.fn(),
      add: vi.fn(),
    },
    resize: vi.fn(),
    destroy: vi.fn(),
    cesiumWidget: {
      creditContainer: {
        style: { display: "" },
      },
    },
  })),
  WebMapServiceImageryProvider: vi.fn(),
  ImageryLayer: vi.fn(),
  Cartesian3: {
    fromDegrees: vi.fn(),
  },
  Color: {
    ORANGERED: "orangered",
  },
  PolylineGraphics: vi.fn(),
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve(mockTrajectory),
    });
  });

  it("renders loading state initially", async () => {
    render(<App />);
    expect(screen.getByText("Loading trajectory data...")).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it("renders Globe component", async () => {
    render(<App />);
    expect(screen.getByText("Globe Component Demo")).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});
