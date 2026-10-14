import { Router } from "express";
import { createEvent } from "../controllers/event.controller.js";

const router = Router();

router.route("/").post(createEvent);

export default router;
