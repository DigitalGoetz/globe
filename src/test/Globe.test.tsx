import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Globe } from "../components/Globe";

// Mock Cesium and resium
vi.mock("resium", () => ({
  Viewer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="cesium-viewer">{children}</div>
  ),
  ImageryLayer: () => <div data-testid="imagery-layer" />,
  Entity: () => <div data-testid="trajectory-entity" />,
}));

vi.mock("cesium", () => ({
  WebMapServiceImageryProvider: vi.fn(),
  Cartesian3: {
    fromDegrees: vi.fn(),
  },
  Color: {
    YELLOW: "yellow",
  },
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
    expect(screen.getByTestId("cesium-viewer")).toBeInTheDocument();
  });

  it("renders layer dropdown with configured layers", () => {
    render(<Globe />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByDisplayValue("test-layer")).toBeInTheDocument();
  });
});
