import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/trajectory/:id", (req, res) => {
  const trajectoryPath = path.join(__dirname, "trajectory.json");
  const trajectoryData = JSON.parse(fs.readFileSync(trajectoryPath, "utf8"));  
  res.json(trajectoryData);
});

app.get("/kmltrajectory/:id", (req, res) =>{
  const kmlPath = path.join(__dirname, "KML_Sample.kml");
  res.sendFile(kmlPath);
})

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Dev API server running on http://localhost:${PORT}`);
});
