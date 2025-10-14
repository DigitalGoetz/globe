import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Globe } from "../components/Globe";

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

describe("Globe", () => {
  it("renders container and dropdown", () => {
    render(<Globe />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders with trajectory when WMS provider exists", () => {
    render(<Globe trajectory={mockTrajectory} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders layer dropdown with configured layers", () => {
    render(<Globe />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByDisplayValue("test-layer")).toBeInTheDocument();
  });
});
