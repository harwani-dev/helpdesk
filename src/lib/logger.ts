import pino from 'pino'

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty'
        // process.env.NODE_ENV !== 'production' ? 'pino-pretty' : undefined
    }
});