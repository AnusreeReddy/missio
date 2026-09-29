import * as missionRepo from '../../repositories/missionRepo.js';
import * as planRepo from '../../repositories/planRepo.js';
import * as checkInRepo from '../../repositories/checkInRepo.js';
import * as userRepo from '../../repositories/userRepo.js';
import { generateMissionVariants } from '../missionGenerator/index.js';

const SLEEP_LOW_THRESHOLD = 5.5;
const WATER_LOW_THRESHOLD_L = 1;

// Decide the *default* variant tier for today, before the user says anything
// at runtime. Explicit stated time (handled by caller passing a smaller
// timeBudgetMin) always wins; this only handles the "quietly protect the
// user from repeating a skip" and "bad night's sleep" signals. See plan §8.
function decideDefaultVariant({ yesterdayMission, checkIn }) {
  const adjustments = [];
  let variant = 'ideal';

  if (yesterdayMission && yesterdayMission.status === 'skipped') {
    variant = 'minimum';
    adjustments.push('yesterday-skipped -> default to minimum today');
  }

  if (checkIn?.sleepHours != null && checkIn.sleepHours < SLEEP_LOW_THRESHOLD) {
    variant = variant === 'ideal' ? 'minimum' : variant;
    adjustments.push(`low sleep (${checkIn.sleepHours}h) -> default to minimum`);
  }

  return { variant, adjustments };
}

function hydrationNudge(userId, date, checkIn) {
  if (checkIn?.waterLiters == null || checkIn.waterLiters >= WATER_LOW_THRESHOLD_L) return null;
  return missionRepo.createMission({
    userId,
    date,
    domain: 'health',
    topic: 'hydration',
    difficulty: 'easy',
    variant: 'rescue',
    title: 'Hydration check-in',
    status: 'planned',
    estMinutes: 1,
    generatedBy: { rule: 'low-water-checkin', aiAssisted: false },
    steps: [
      {
        contentItemId: null,
        order: 0,
        durationSec: 60,
        instruction: 'Drink a full glass of water right now.',
        label: 'Hydrate',
        url: null,
        completedAt: null,
      },
    ],
  });
}

// Generate (or return existing) plan for a given date, covering every
// domain the user has an active goal in.
export async function generatePreflight(userId, date) {
  const existing = planRepo.getPlanForDate(userId, date);
  if (existing) return hydrate(existing);

  const user = userRepo.findUserById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const goals = user.goals?.length ? user.goals : [{ category: 'dsa', level: 'easy', dailyTimeBudgetMin: 25 }];
  const checkIn = checkInRepo.getLatestCheckIn(userId);

  const missionIds = [];
  const adjustmentsAll = [];

  for (const goal of goals) {
    const domain = goal.category;
    const timeBudgetMin = goal.dailyTimeBudgetMin || 20;

    const yesterdayMission = missionRepo.listRecentByDomain(userId, domain, 2)[1] || null;
    const { variant: defaultVariant, adjustments } = decideDefaultVariant({ yesterdayMission, checkIn });
    adjustmentsAll.push(...adjustments);

    const { topic, difficulty, variants } = await generateMissionVariants(userId, domain, timeBudgetMin);
    const active = variants[defaultVariant];

    const mission = missionRepo.createMission({
      userId,
      date,
      domain,
      topic,
      difficulty,
      variant: defaultVariant,
      title: active.title,
      status: 'planned',
      estMinutes: active.estMinutes,
      generatedBy: active.generatedBy,
      steps: active.steps,
      variantsAvailable: variants,
    });
    missionIds.push(mission._id);
  }

  const hydration = hydrationNudge(userId, date, checkIn);
  if (hydration) {
    missionIds.push(hydration._id);
    adjustmentsAll.push('low water -> added hydration nudge');
  }

  const plan = planRepo.createPlan({
    userId,
    date,
    missionIds,
    basis: {
      checkInId: checkIn?._id || null,
      adjustmentsApplied: adjustmentsAll,
    },
  });

  return hydrate(plan);
}

function hydrate(plan) {
  const missions = plan.missionIds.map((id) => missionRepo.getMission(id)).filter(Boolean);
  return { ...plan, missions };
}

export function getPlanForDate(userId, date) {
  const plan = planRepo.getPlanForDate(userId, date);
  return plan ? hydrate(plan) : null;
}

// Runtime rescue: instant swap using precomputed variants, no regeneration.
export function swapVariant(missionId, variant) {
  const mission = missionRepo.getMission(missionId);
  if (!mission) throw Object.assign(new Error('Mission not found'), { status: 404 });
  if (!mission.variantsAvailable || !mission.variantsAvailable[variant]) {
    throw Object.assign(new Error(`Variant "${variant}" not available for this mission`), { status: 400 });
  }
  const chosen = mission.variantsAvailable[variant];
  return missionRepo.updateMission(missionId, {
    variant,
    title: chosen.title,
    steps: chosen.steps,
    estMinutes: chosen.estMinutes,
    status: 'planned',
  });
}
