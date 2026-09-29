import * as contentRepo from '../../repositories/contentRepo.js';

export function topicsForDomain(domain) {
  return contentRepo.topicsForDomain(domain);
}

// Difficulty bands to pull from, given the topic's current mastery level.
// A user at 'medium' also sees a couple of 'easy' items mixed in as warm-up.
const DIFFICULTY_BANDS = {
  easy: ['easy'],
  medium: ['easy', 'medium'],
  hard: ['medium', 'hard'],
};

export function candidatesForTopic(domain, topic, difficulty) {
  const band = DIFFICULTY_BANDS[difficulty] || ['easy'];
  return contentRepo.findByDomainAndDifficulty(domain, { topic, difficultyIn: band });
}

export function allForDomain(domain) {
  return contentRepo.findByDomain(domain);
}

export function bandFor(difficulty) {
  return DIFFICULTY_BANDS[difficulty] || ['easy'];
}
