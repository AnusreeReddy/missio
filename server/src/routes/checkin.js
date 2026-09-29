import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as checkInRepo from '../repositories/checkInRepo.js';

const router = Router();
router.use(requireAuth);

function today() {
  return new Date().toISOString().slice(0, 10);
}

router.post('/', (req, res) => {
  const date = req.body.date || today();
  const { sleepHours, waterLiters, stepsApprox, energyLevel } = req.body;
  const checkIn = checkInRepo.upsertCheckIn(req.userId, date, { sleepHours, waterLiters, stepsApprox, energyLevel });
  res.json(checkIn);
});

router.get('/:date', (req, res) => {
  const checkIn = checkInRepo.getCheckIn(req.userId, req.params.date);
  res.json(checkIn || null);
});

export default router;
