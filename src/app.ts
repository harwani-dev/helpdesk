import express from 'express';
import AuthRouter from './routes/auth';
import UserRouter from './routes/user';
import TicketRouter from './routes/ticket';
import FeedbackRouter from './routes/feedback';
import { pinoHttp } from 'pino-http';
import { logger } from './lib/logger';
import { ActivityRouter } from './routes/activity';
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));

app.use('/api/auth', AuthRouter);
app.use('/api/users', UserRouter);
app.use('/api/tickets', TicketRouter);
app.use('/api/feedback', FeedbackRouter);
app.use('/api/activity', ActivityRouter);

export default app;