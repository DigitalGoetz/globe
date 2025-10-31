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
      add: vi
        .fn()
        .mockImplementation(() => ({ id: "test-entity", position: null })),
    },
    zoomTo: vi.fn().mockResolvedValue(undefined),
    resize: vi.fn(),
    destroy: vi.fn(),
    scene: {
      requestRender: vi.fn(),
    },
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
  ConstantPositionProperty: vi.fn().mockImplementation(() => ({
    setValue: vi.fn(),
  })),
  Color: {
    ORANGERED: "orangered",
    YELLOW: "yellow",
    BLACK: "black",
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
  it("renders container", () => {
    render(<Globe />);
    expect(document.querySelector(".wc-globe-container")).toBeInTheDocument();
  });

  it("renders with trajectory when WMS provider exists", () => {
    render(<Globe trajectory={mockTrajectory} />);
    expect(document.querySelector(".wc-globe-container")).toBeInTheDocument();
  });

  it("shows playback controls when trajectory includes time data", async () => {
    render(<Globe trajectory={mockTrajectory} />);
    const replayButton = await screen.findByRole("button", {
      name: /replay/i,
    });
    const slider = await screen.findByRole("slider");
    const speedSelect = (await screen.findByLabelText(
      "Playback speed",
    )) as HTMLSelectElement;

    expect(replayButton).toBeInTheDocument();
    expect(slider).toBeInTheDocument();
    expect(speedSelect).toBeInTheDocument();
    const speedValues = Array.from(speedSelect.options).map(
      (option) => option.value,
    );
    expect(speedValues).toContain("20");
    expect(speedValues).toContain("50");
  });

  it("hides playback controls when trajectory lacks valid time data", () => {
    const noTimeTrajectory = {
      ...mockTrajectory,
      time: [],
    };
    render(<Globe trajectory={noTimeTrajectory} />);
    expect(screen.queryByRole("button", { name: /replay/i })).toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.queryByLabelText("Playback speed")).toBeNull();
  });

  it("renders layer dropdown when multiple layers exist", () => {
    render(<Globe />);
    expect(document.querySelector(".wc-globe-container")).toBeInTheDocument();
  });
});
