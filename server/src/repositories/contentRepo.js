import { collection } from '../db/jsonStore.js';

const ContentItems = collection('contentItems');

export function bulkSeed(items) {
  const existing = ContentItems.find({});
  let inserted = 0;
  for (const item of items) {
    const label = item.payload?.title || item.payload?.name;
    const already = existing.some(
      (e) => e.domain === item.domain && (e.payload?.title || e.payload?.name) === label
    );
    if (already) continue;
    const created = ContentItems.insert(item);
    existing.push(created);
    inserted += 1;
  }
  return inserted;
}

export function findByDomainAndDifficulty(domain, { topic, difficultyIn, excludeIds = [] } = {}) {
  const all = ContentItems.find({ domain });
  return all.filter((item) => {
    if (topic && item.topic !== topic) return false;
    if (difficultyIn && !difficultyIn.includes(item.difficulty)) return false;
    if (excludeIds.includes(item._id)) return false;
    return true;
  });
}

export function findByDomain(domain) {
  return ContentItems.find({ domain });
}

export function findById(id) {
  return ContentItems.findById(id);
}

export function topicsForDomain(domain) {
  const items = ContentItems.find({ domain });
  return [...new Set(items.map((i) => i.topic))];
}

export function count(query = {}) {
  return ContentItems.count(query);
}
