import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import eventRouter from "./routes/event.routes.js";
import sessionRouter from "./routes/session.routes.js";
import heatmapRouter from "./routes/heatmap.routes.js";
import { apiNotFound, errorHandler } from "./middlewares/error.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public"); // tracker.js + demo pages
const frontendDist = path.resolve(__dirname, "../../frontend/dist"); // built React app

const app = express();

// Two CORS policies, because two kinds of callers exist:
//  1) openCors      -> the tracker, running on ANY customer website, posting events.
//  2) dashboardCors -> the React dashboard (hosted on Vercel), reading data. Only the
//                      origins listed in CORS_ORIGIN (comma separated) are allowed.
//                      If CORS_ORIGIN is empty (local dev) every origin is allowed.
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const openCors = cors();
const dashboardCors = cors({
  origin: (origin, callback) => {
    // No Origin header = not a browser cross-origin call (curl, same-origin): allow.
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false); // browser will block the response
  },
});

// The tracker posts with Content-Type text/plain (avoids a CORS preflight request and
// works with sendBeacon), so we ask express.json() to parse that content type too.
app.use(express.json({ limit: "100kb", type: ["application/json", "text/plain"] }));

// Static files: /tracker.js and /demo/*.html
app.use(express.static(publicDir, { maxAge: "5m" }));

app.get("/api/v1/health", openCors, (_req, res) => {
  res.status(200).json({ success: true, message: "OK", uptime: process.uptime() });
});

app.use("/api/v1/events", openCors, eventRouter);
app.use("/api/v1/sessions", dashboardCors, sessionRouter);
app.use("/api/v1/heatmap", dashboardCors, heatmapRouter);
app.use("/api", apiNotFound);

// OPTIONAL: if frontend/dist exists (you built the dashboard next to the backend), serve it
// too. With the Vercel + Render split it does not exist on Render, so this block is skipped.
if (fs.existsSync(path.join(frontendDist, "index.html"))) {
  app.use(express.static(frontendDist));
  // React Router handles /sessions, /heatmap... so any other GET returns index.html.
  app.get(/^\/(?!api\/|demo\/|tracker\.js).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use(errorHandler);

export default app;
