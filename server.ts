import express from "express";
import path from "path";
import { exec } from "child_process";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Ensure NODE_ENV is set to production if not already set
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory cache for latest cycle state
  let latestCycleCache: any = null;

  // Helper to execute runner.py CLI
  const runPythonRunner = (args: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const command = `python3 runner.py ${args}`;
      exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Runner Error: ${error.message}`);
          console.error(`Stderr: ${stderr}`);
          return reject(error);
        }
        try {
          const parsed = JSON.parse(stdout);
          resolve(parsed);
        } catch (e) {
          console.error("Failed to parse JSON output from runner.py", stdout);
          reject(e);
        }
      });
    });
  };

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "DHANVANTARI Signal Fusion Pipeline", timestamp: new Date().toISOString() });
  });

  // Execute full cycle
  app.post("/api/cycle", async (req, res) => {
    try {
      const districts = req.body?.districts ? `--districts="${req.body.districts.join(",")}"` : "";
      const result = await runPythonRunner(`--action=cycle ${districts}`);
      latestCycleCache = result;
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Pipeline execution failed", details: err.message });
    }
  });

  // Get current or trigger new cycle if cache empty
  app.get("/api/cycle", async (_req, res) => {
    try {
      if (!latestCycleCache) {
        latestCycleCache = await runPythonRunner("--action=cycle");
      }
      res.json(latestCycleCache);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch cycle state", details: err.message });
    }
  });

  // Trigger simulated signal spike
  app.post("/api/simulate", async (req, res) => {
    try {
      const { district = "Kamrup Metropolitan", disease_score = 92.0, weather_score = 88.0, hospital_score = 85.0, spike_type = "vector_borne" } = req.body || {};
      const args = `--action=simulate --district="${district}" --disease_score=${disease_score} --weather_score=${weather_score} --hospital_score=${hospital_score} --spike_type="${spike_type}"`;
      const result = await runPythonRunner(args);
      latestCycleCache = result;
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Simulation execution failed", details: err.message });
    }
  });

  // Get alerts log
  app.get("/api/alerts", (_req, res) => {
    try {
      const alertsPath = path.join(process.cwd(), "logs", "alerts.json");
      if (fs.existsSync(alertsPath)) {
        const raw = fs.readFileSync(alertsPath, "utf-8");
        res.json(JSON.parse(raw));
      } else {
        res.json([]);
      }
    } catch (err: any) {
      res.json([]);
    }
  });

  // Get district context
  app.get("/api/context/:district", async (req, res) => {
    try {
      const district = req.params.district;
      const result = await runPythonRunner(`--action=context --district="${district}"`);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load district context", details: err.message });
    }
  });

  // Vite middleware setup
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DHANVANTARI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
