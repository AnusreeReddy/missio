import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as adaptivePlanner from '../services/adaptivePlanner/index.js';

const router = Router();
router.use(requireAuth);

function today() {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/plan/today — generates the plan on first call of the day (preflight),
// returns the existing one on subsequent calls (idempotent).
router.get('/today', async (req, res, next) => {
  try {
    const plan = await adaptivePlanner.generatePreflight(req.userId, today());
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

router.get('/:date', async (req, res, next) => {
  try {
    const plan = await adaptivePlanner.generatePreflight(req.userId, req.params.date);
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

export default router;
