import { Router } from "express";
import { getHeatmapPages, getHeatmapData } from "../controllers/heatmap.controller.js";

const router = Router();

// Order matters: "/pages" must be declared before any "/:param" style route.
router.route("/pages").get(getHeatmapPages);
router.route("/").get(getHeatmapData);

export default router;
