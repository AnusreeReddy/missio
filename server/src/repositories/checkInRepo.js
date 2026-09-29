import { collection } from '../db/jsonStore.js';

const CheckIns = collection('dailyCheckIns');

export function upsertCheckIn(userId, date, data) {
  const existing = CheckIns.findOne({ userId, date });
  if (existing) return CheckIns.updateById(existing._id, data);
  return CheckIns.insert({ userId, date, sleepHours: null, waterLiters: null, stepsApprox: null, energyLevel: null, ...data });
}

export function getCheckIn(userId, date) {
  return CheckIns.findOne({ userId, date });
}

export function getLatestCheckIn(userId) {
  const all = CheckIns.find({ userId }).sort((a, b) => (a.date < b.date ? 1 : -1));
  return all[0] || null;
}
