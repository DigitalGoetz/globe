import { render, screen } from "@testing-library/react";
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

// Mock Cesium and resium
vi.mock("resium", () => ({
  Viewer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="cesium-viewer">{children}</div>
  ),
  ImageryLayer: () => <div data-testid="imagery-layer" />,
  Entity: () => <div data-testid="trajectory-entity" />,
}));

vi.mock("cesium", () => ({
  Ion: {
    defaultAccessToken: "",
  },
  WebMapServiceImageryProvider: vi.fn(),
  Cartesian3: {
    fromDegrees: vi.fn(),
  },
  Color: {
    ORANGERED: "orangered",
  },
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({}),
    });
  });

  it("renders loading state initially", () => {
    render(<App />);
    expect(screen.getByText("Loading trajectory data...")).toBeInTheDocument();
  });

  it("renders Globe component", () => {
    render(<App />);
    expect(screen.getByText("Globe Component Demo")).toBeInTheDocument();
  });
});
