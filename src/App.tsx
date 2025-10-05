import { Globe } from "./components";

function App() {
  // Sample aircraft trajectory data
  const sampleTrajectory = [
    { longitude: -74.0, latitude: 40.7, altitude: 10000 }, // NYC
    { longitude: -87.6, latitude: 41.9, altitude: 35000 }, // Chicago
    { longitude: -104.9, latitude: 39.7, altitude: 35000 }, // Denver
    { longitude: -118.2, latitude: 34.1, altitude: 10000 }, // LA
  ];

  return (
    <div style={{ backgroundColor: "#333333", minHeight: "100vh" }}>
      <h1 style={{ margin: "20px", color: "white" }}>Globe Component Demo</h1>

      <div
        style={{
          height: "50vh",
          width: "55%",
          margin: "0 auto",
          overflow: "hidden",
        }}
      >
        <Globe trajectoryData={sampleTrajectory} />
      </div>
    </div>
  );
}

export default App;
