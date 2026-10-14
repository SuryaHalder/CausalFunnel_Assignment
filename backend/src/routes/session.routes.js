import { Router } from "express";
import { getSessions, getSessionEvents } from "../controllers/session.controller.js";

const router = Router();

router.route("/").get(getSessions);
router.route("/:sessionId/events").get(getSessionEvents);

export default router;
