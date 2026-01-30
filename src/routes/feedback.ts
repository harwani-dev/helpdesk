import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/middleware";
import { getFeedbacks, giveFeedback } from "../controllers/feedback";

const FeedbackRouter = Router();

FeedbackRouter.get('/', authenticateToken, requireAdmin, getFeedbacks);

FeedbackRouter.post('/', authenticateToken, giveFeedback);

export default FeedbackRouter;
