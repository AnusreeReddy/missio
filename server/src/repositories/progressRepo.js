import { collection } from '../db/jsonStore.js';

const Progress = collection('progress');

// One doc per (userId, domain, topicId).
export function getTopicState(userId, domain, topicId) {
  return Progress.findOne({ userId, domain, topicId });
}

export function listForUserDomain(userId, domain) {
  return Progress.find({ userId, domain });
}

export function upsertTopicState(userId, domain, topicId, patch) {
  const existing = getTopicState(userId, domain, topicId);
  if (existing) {
    return Progress.updateById(existing._id, patch);
  }
  return Progress.insert({
    userId,
    domain,
    topicId,
    lastDifficulty: 'easy',
    lastCompletedAt: null,
    successStreak: 0,
    failStreak: 0,
    ...patch,
  });
}

// Simple spaced-repetition-ish bump/rollback:
// 2 successes in a row at a difficulty -> bump; a fail -> roll back / hold.
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

export function recordOutcome(userId, domain, topicId, outcome) {
  const state = getTopicState(userId, domain, topicId) || {
    lastDifficulty: 'easy',
    successStreak: 0,
    failStreak: 0,
  };

  let { lastDifficulty, successStreak = 0, failStreak = 0 } = state;
  const idx = DIFFICULTY_ORDER.indexOf(lastDifficulty);

  if (outcome === 'success') {
    successStreak += 1;
    failStreak = 0;
    if (successStreak >= 2 && idx < DIFFICULTY_ORDER.length - 1) {
      lastDifficulty = DIFFICULTY_ORDER[idx + 1];
      successStreak = 0;
    }
  } else {
    failStreak += 1;
    successStreak = 0;
    if (failStreak >= 2 && idx > 0) {
      lastDifficulty = DIFFICULTY_ORDER[idx - 1];
      failStreak = 0;
    }
  }

  return upsertTopicState(userId, domain, topicId, {
    lastDifficulty,
    successStreak,
    failStreak,
    lastCompletedAt: new Date().toISOString(),
  });
}
