import { collection } from '../db/jsonStore.js';

const Users = collection('users');

export function createUser({ email, passwordHash }) {
  if (Users.findOne({ email })) {
    const err = new Error('An account with this email already exists');
    err.status = 409;
    throw err;
  }
  return Users.insert({
    email,
    passwordHash,
    goals: [], // [{ category: 'dsa'|'fitness', level, dailyTimeBudgetMin }]
    preferences: { wakeTime: null, reminderOptIn: false },
  });
}

export function findUserByEmail(email) {
  return Users.findOne({ email });
}

export function findUserById(id) {
  return Users.findById(id);
}

export function updateUser(id, patch) {
  return Users.updateById(id, patch);
}

export function setGoals(id, goals) {
  return Users.updateById(id, { goals });
}
