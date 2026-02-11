import express from 'express';
import AuthRouter from './routes/auth.js';
import UserRouter from './routes/user.js';
import TicketRouter from './routes/ticket.js';
import FeedbackRouter from './routes/feedback.js';
import { pinoHttp } from 'pino-http';
import { logger } from './lib/logger.js';
import { ActivityRouter } from './routes/activity.js';
import cors from "cors";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));
app.use(cors());

app.use('/api/auth', AuthRouter);
app.use('/api/users', UserRouter);
app.use('/api/tickets', TicketRouter);
app.use('/api/feedback', FeedbackRouter);
app.use('/api/activity', ActivityRouter);

export default app;