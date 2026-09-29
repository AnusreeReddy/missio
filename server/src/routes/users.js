import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as userRepo from '../repositories/userRepo.js';

const router = Router();
router.use(requireAuth);

const VALID_CATEGORIES = ['dsa', 'fitness'];

router.get('/me', (req, res) => {
  const { passwordHash, ...user } = userRepo.findUserById(req.userId);
  res.json(user);
});

router.put('/me/goals', (req, res) => {
  const { goals } = req.body;
  if (!Array.isArray(goals) || goals.length === 0) {
    return res.status(400).json({ error: 'goals must be a non-empty array' });
  }
  for (const g of goals) {
    if (!VALID_CATEGORIES.includes(g.category)) {
      return res.status(400).json({ error: `Unsupported goal category "${g.category}". Supported: ${VALID_CATEGORIES.join(', ')}` });
    }
    if (!g.dailyTimeBudgetMin || g.dailyTimeBudgetMin <= 0) {
      return res.status(400).json({ error: 'Each goal needs a positive dailyTimeBudgetMin' });
    }
    if (!g.level) g.level = 'easy';
  }
  const updated = userRepo.setGoals(req.userId, goals);
  const { passwordHash, ...user } = updated;
  res.json(user);
});

export default router;
