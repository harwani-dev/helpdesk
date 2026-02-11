import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/middleware.js";
import { getActivity } from "../controllers/activity.js";

export const ActivityRouter = Router()
ActivityRouter.use(authenticateToken, requireAdmin);
ActivityRouter.get("/", getActivity);