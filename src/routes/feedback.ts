import { prisma } from "../lib/prisma";
import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/middleware";
import { logActivity } from "../lib/activity";
import { ActivityType } from "../../generated/prisma/enums";
import { sendResponse } from "../lib/sendResponse";
import { HTTP_STATUS } from "../constants/status";
import { getFeedbacks } from "../controllers/feedback";
import { createFeedbackSchema } from "../validation/feedback";
import { UserType, TicketStatus, TicketType } from "../../generated/prisma/enums";
import { logger } from "../utils/logger";

const FeedbackRouter = Router();

FeedbackRouter.get('/', authenticateToken, requireAdmin, getFeedbacks);


FeedbackRouter.post('/', authenticateToken, async (req, res) => { 
  
});

export default FeedbackRouter;
