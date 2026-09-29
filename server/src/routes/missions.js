import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as missionRepo from '../repositories/missionRepo.js';
import * as adaptivePlanner from '../services/adaptivePlanner/index.js';
import * as progressEngine from '../services/progressEngine/index.js';

const router = Router();
router.use(requireAuth);

function ownedMission(req, res) {
  const mission = missionRepo.getMission(req.params.id);
  if (!mission || mission.userId !== req.userId) {
    res.status(404).json({ error: 'Mission not found' });
    return null;
  }
  return mission;
}

router.get('/:id', (req, res) => {
  const mission = ownedMission(req, res);
  if (!mission) return;
  res.json(mission);
});

// Instant rescue/minimum swap — uses precomputed variants, no regeneration.
router.post('/:id/variant', (req, res) => {
  const mission = ownedMission(req, res);
  if (!mission) return;
  const { variant } = req.body;
  if (!['ideal', 'minimum', 'rescue'].includes(variant)) {
    return res.status(400).json({ error: 'variant must be one of ideal | minimum | rescue' });
  }
  try {
    const updated = adaptivePlanner.swapVariant(mission._id, variant);
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/:id/start', (req, res) => {
  const mission = ownedMission(req, res);
  if (!mission) return;
  const updated = missionRepo.updateMission(mission._id, { status: 'in_progress', startedAt: new Date().toISOString() });
  res.json(updated);
});

// Mark a single step done, auto-advances; marks mission complete when all
// steps are done and records the outcome against the progress engine.
router.post('/:id/steps/:index/complete', (req, res) => {
  const mission = ownedMission(req, res);
  if (!mission) return;
  const idx = Number(req.params.index);
  const updated = missionRepo.markStepComplete(mission._id, idx);
  if (!updated) return res.status(404).json({ error: 'Step not found' });

  if (updated.status === 'completed' && updated.domain !== 'health') {
    const outcome = req.body?.outcome === 'struggled' ? 'fail' : 'success';
    progressEngine.recordOutcome(req.userId, updated.domain, updated.topic, outcome);
  }
  res.json(updated);
});

router.post('/:id/skip', (req, res) => {
  const mission = ownedMission(req, res);
  if (!mission) return;
  const updated = missionRepo.updateMission(mission._id, { status: 'skipped' });
  res.json(updated);
});

export default router;
