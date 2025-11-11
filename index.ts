import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import bodyParser from 'body-parser';
import { collectDefaultMetrics, register } from 'prom-client';



const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const httpLogger = pinoHttp({ logger });

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(compression());
app.use(bodyParser.json({ limit: '1mb' }));

const limiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: Number(process.env.RATE_LIMIT_MAX || 10),
});
app.use(limiter);

app.use(httpLogger as any);

collectDefaultMetrics();

app.get('/health', (_req: Request, res: Response) => {
	res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/', (_req: Request, res: Response) => {
	res.json({ message: 'Welcome to the production-ready Express API' });
});

app.post('/echo', (req: Request, res: Response, next: NextFunction) => {
	try {
		const payload = req.body;
		if (!payload || typeof payload !== 'object') {
			res.status(400).json({ error: 'Invalid JSON payload' });
			return;
		}
		res.json({ received: payload });
	} catch (err) {
		next(err);
	}
});

app.get('/metrics', async (_req: Request, res: Response) => {
	try {
		res.set('Content-Type', register.contentType);
		const metrics = await register.metrics();
		res.send(metrics);
	} catch (err) {
		logger.error({ err }, 'Failed to collect metrics');
		res.status(500).send('Error collecting metrics');
	}
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
	logger.error({ err }, 'Unhandled error');
	const status = err && err.status ? err.status : 500;
	res.status(status).json({ error: err && err.message ? err.message : 'Internal Server Error' });
});

const PORT = Number(process.env.PORT || 3000);
const server = app.listen(PORT, () => {
	logger.info({ port: PORT }, 'Server started');
});

const shutdown = (signal: string) => {
	logger.info({ signal }, 'Shutting down server');
	server.close((err?: Error) => {
		if (err) {
			logger.error({ err }, 'Error closing server');
			process.exit(1);
		}
		logger.info('Server closed');
		process.exit(0);
	});
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default app;
