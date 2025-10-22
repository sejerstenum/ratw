import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import { config } from './config';
import segmentsRouter from './routes/segments';
import { ensureSchema } from './services/segmentsStore';

const app = express();

if (config.corsOrigins) {
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    }),
  );
} else {
  app.use(cors());
}

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/segments', segmentsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  void _next;
  console.error('[bff] unexpected error', err);
  res.status(500).json({ message: 'Internal server error.' });
});

await ensureSchema();

app.listen(config.port, () => {
  console.log(`BFF listening on http://localhost:${config.port}`);
});
