import * as progressRepo from '../../repositories/progressRepo.js';
import { topicsForDomain } from '../contentLibrary/index.js';

// Curriculum order matters for a brand-new user (never-attempted topics come
// first, in this order); once everything's been touched, rotation falls back
// to least-recently-practiced.
export const DSA_TOPIC_ORDER = [
  'arrays',
  'two-pointers',
  'binary-search',
  'sliding-window',
  'hashing',
  'linked-list',
  'stacks',
  'trees',
  'graphs',
  'dynamic-programming',
  'backtracking',
];

export function difficultyForTopic(userId, domain, topicId) {
  const state = progressRepo.getTopicState(userId, domain, topicId);
  return state?.lastDifficulty || 'easy';
}

// Pick the single best "focus topic" for today, in a given domain.
export function pickFocusTopic(userId, domain) {
  const available = topicsForDomain(domain);
  const order = domain === 'dsa' ? DSA_TOPIC_ORDER.filter((t) => available.includes(t)) : available;
  const stateByTopic = new Map(
    progressRepo.listForUserDomain(userId, domain).map((p) => [p.topicId, p])
  );

  const neverAttempted = order.find((t) => !stateByTopic.has(t));
  if (neverAttempted) return neverAttempted;

  // Least-recently-practiced among attempted topics.
  let best = order[0];
  let bestTime = Infinity;
  for (const topic of order) {
    const state = stateByTopic.get(topic);
    const t = state?.lastCompletedAt ? new Date(state.lastCompletedAt).getTime() : 0;
    if (t < bestTime) {
      bestTime = t;
      best = topic;
    }
  }
  return best;
}

export function recordOutcome(userId, domain, topicId, outcome) {
  return progressRepo.recordOutcome(userId, domain, topicId, outcome);
}
