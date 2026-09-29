import { collection } from '../db/jsonStore.js';

const Missions = collection('missions');

export function createMission(data) {
  return Missions.insert({
    status: 'planned',
    variant: 'ideal',
    actualMinutes: null,
    variantsAvailable: null, // { ideal, minimum, rescue } — precomputed at preflight for instant swap
    ...data,
  });
}

export function getMission(id) {
  return Missions.findById(id);
}

export function listForUserDate(userId, date) {
  return Missions.find({ userId, date });
}

export function updateMission(id, patch) {
  return Missions.updateById(id, patch);
}

export function markStepComplete(missionId, stepIndex) {
  const mission = Missions.findById(missionId);
  if (!mission) return null;
  const steps = [...mission.steps];
  if (!steps[stepIndex]) return null;
  steps[stepIndex] = { ...steps[stepIndex], completedAt: new Date().toISOString() };
  const allDone = steps.every((s) => s.completedAt);
  return Missions.updateById(missionId, {
    steps,
    status: allDone ? 'completed' : 'in_progress',
  });
}

export function listRecentByDomain(userId, domain, limitDays = 7) {
  const all = Missions.find({ userId, domain }).sort((a, b) => (a.date < b.date ? 1 : -1));
  return all.slice(0, limitDays);
}
