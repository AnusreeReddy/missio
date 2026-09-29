import { collection } from '../db/jsonStore.js';

const Plans = collection('plans');

export function createPlan(data) {
  return Plans.insert(data);
}

export function getPlanForDate(userId, date) {
  return Plans.findOne({ userId, date });
}

export function updatePlan(id, patch) {
  return Plans.updateById(id, patch);
}
