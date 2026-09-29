import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import checkinRoutes from './routes/checkin.js';
import planRoutes from './routes/plan.js';
import missionRoutes from './routes/missions.js';
import progressRoutes from './routes/progress.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true, driver: process.env.MONGODB_URI ? 'mongo (not implemented in this build)' : 'file' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/progress', progressRoutes);

// Production: serve the built client (client/dist) and fall back to index.html for SPA routes.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

export default app;
