import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/middleware.js";
import { getFeedbacks, giveFeedback } from "../controllers/feedback.js";

const FeedbackRouter = Router();

FeedbackRouter.get('/:department', authenticateToken, requireAdmin, getFeedbacks);

FeedbackRouter.post('/', authenticateToken, giveFeedback);

export default FeedbackRouter;
