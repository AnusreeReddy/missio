import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bulkSeed } from '../src/repositories/contentRepo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadJson(name) {
  const raw = fs.readFileSync(path.join(__dirname, name), 'utf-8');
  return JSON.parse(raw);
}

const dsa = loadJson('dsa-problems.json');
const exercises = loadJson('exercises.json');

const insertedDsa = bulkSeed(dsa);
const insertedEx = bulkSeed(exercises);

console.log(`Seeded ${insertedDsa}/${dsa.length} DSA problems, ${insertedEx}/${exercises.length} exercises.`);
