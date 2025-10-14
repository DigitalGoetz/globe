import { Globe } from "./components/Globe";
import { useEffect, useState } from "react";

interface Trajectory {
  id: string;
  time: number[];
  latitude: number[];
  longitude: number[];
  altitude: number[];
  mach: number[];
  dynamic_pressure: number[];
  segment_start: number;
  segment_end: number;
}

function App() {
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null);

  useEffect(() => {
    fetch("/api/trajectory/1")
      .then((res) => res.json())
      .then((data) => setTrajectory(data))
      .catch(console.error);
  }, []);

  return (
    <div style={{ backgroundColor: "#333333", minHeight: "100vh" }}>
      <h1 style={{ margin: "20px", color: "white" }}>Globe Component Demo</h1>

      {trajectory ? (
        <div style={{ margin: "20px", color: "white", fontSize: "14px" }}>
          Trajectory ID: {trajectory.id} | Start:{" "}
          {new Date(trajectory.segment_start).toLocaleString()} | End:{" "}
          {new Date(trajectory.segment_end).toLocaleString()}
        </div>
      ) : (
        <div style={{ margin: "20px", color: "white", fontSize: "14px" }}>
          Loading trajectory data...
        </div>
      )}

      <div style={{ width: "800px", height: "600px", margin: "20px" }}>
        <Globe
          trajectory={trajectory}
          controls={{
            baseLayerPicker: false,
            animation: false,
            timeline: false,
            geocoder: false,
            sceneModePicker: false,
            navigationHelpButton: false,
          }}
        />
      </div>
    </div>
  );
}

export default App;
