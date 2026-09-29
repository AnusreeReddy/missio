import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as progressRepo from '../repositories/progressRepo.js';
import * as userRepo from '../repositories/userRepo.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const user = userRepo.findUserById(req.userId);
  const domains = [...new Set((user.goals || []).map((g) => g.category))];
  const byDomain = {};
  for (const domain of domains) {
    byDomain[domain] = progressRepo
      .listForUserDomain(req.userId, domain)
      .sort((a, b) => (a.topicId > b.topicId ? 1 : -1));
  }
  res.json(byDomain);
});

export default router;
