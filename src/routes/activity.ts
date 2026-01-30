import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/middleware";
import { getActivity } from "../controllers/activity";

export const ActivityRouter = Router()
ActivityRouter.use(authenticateToken, requireAdmin);
ActivityRouter.get("/", getActivity);