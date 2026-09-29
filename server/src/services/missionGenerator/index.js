import * as contentLibrary from '../contentLibrary/index.js';
import * as progressEngine from '../progressEngine/index.js';
import { packageMissionWithAI } from '../../ai/client.js';

// ---- Stage 1: deterministic selection (no AI) -----------------------------
//
// Given a time budget, greedily fill it with candidate items for the user's
// current focus topic/difficulty. Produces the Ideal item list; Minimum and
// Rescue are then derived as slices of the same list (see plan §7).

function greedyFill(candidates, timeBudgetMin) {
  // Prefer a mix: put the topic's "primary" difficulty items first, but
  // shuffle deterministically by estMinutes ascending so short items are used
  // to round out the budget precisely.
  const sorted = [...candidates].sort((a, b) => a.estMinutes - b.estMinutes);
  const selected = [];
  let total = 0;
  for (const item of sorted) {
    if (total + item.estMinutes > timeBudgetMin && selected.length > 0) continue;
    selected.push(item);
    total += item.estMinutes;
    if (total >= timeBudgetMin) break;
  }
  if (selected.length === 0 && sorted.length > 0) selected.push(sorted[0]); // always give at least one item
  return { selected, total };
}

export function selectCandidates(userId, domain, timeBudgetMin) {
  const topic = progressEngine.pickFocusTopic(userId, domain);
  const difficulty = progressEngine.difficultyForTopic(userId, domain, topic);
  const pool = contentLibrary.candidatesForTopic(domain, topic, difficulty);

  const idealBudget = Math.max(timeBudgetMin, 10);
  let { selected: idealItems, total: idealMinutes } = greedyFill(pool, idealBudget);

  // Top up from other topics (same difficulty band) when the focus topic's pool
  // can't fill most of the time budget, so missions aren't artificially tiny.
  if (idealMinutes < idealBudget * 0.8) {
    const band = contentLibrary.bandFor(difficulty);
    const chosen = new Set(idealItems.map((i) => i._id));
    const extras = contentLibrary
      .allForDomain(domain)
      .filter((i) => !chosen.has(i._id) && i.topic !== topic && band.includes(i.difficulty))
      .sort((a, b) => a.estMinutes - b.estMinutes);
    for (const item of extras) {
      if (idealMinutes + item.estMinutes > idealBudget) continue;
      idealItems.push(item);
      idealMinutes += item.estMinutes;
      if (idealMinutes >= idealBudget * 0.8) break;
    }
  }

  // Minimum: first ~40% of the ideal list, at least 1 item.
  const minCount = Math.max(1, Math.round(idealItems.length * 0.4));
  const minimumItems = idealItems.slice(0, minCount);

  // Rescue: single highest-priority (shortest, so it always fits) item.
  const rescueItems = idealItems.slice(0, 1);

  return {
    topic,
    difficulty,
    ideal: { items: idealItems, estMinutes: idealMinutes },
    minimum: { items: minimumItems, estMinutes: minimumItems.reduce((s, i) => s + i.estMinutes, 0) },
    rescue: { items: rescueItems, estMinutes: rescueItems.reduce((s, i) => s + i.estMinutes, 0) },
  };
}

// ---- Stage 2: packaging (AI-assisted, deterministic fallback) -------------

function deterministicPackaging(domain, topic, items) {
  const label = domain === 'dsa' ? 'DSA' : 'Workout';
  const title = `${label}: ${titleCase(topic)}`;
  const steps = items.map((item, idx) => ({
    itemIndex: idx,
    instruction: deterministicInstruction(domain, item),
  }));
  return { title, steps };
}

function deterministicInstruction(domain, item) {
  if (domain === 'dsa') {
    return `Solve "${item.payload.title}" (${item.difficulty}). Aim for a working solution, then review the approach.`;
  }
  const p = item.payload;
  return `${p.name}: ${p.sets} sets x ${p.reps} reps, rest ${p.restSec}s between sets.`;
}

function titleCase(s) {
  return s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

export async function packageVariant(domain, topic, difficulty, items) {
  if (items.length === 0) {
    return { title: `${domain === 'dsa' ? 'DSA' : 'Workout'} mission`, steps: [] };
  }
  const aiResult = await packageMissionWithAI({ domain, topic, difficulty, items });
  const packaging = aiResult || deterministicPackaging(domain, topic, items);

  return {
    title: packaging.title,
    generatedBy: { rule: 'stage1-greedy-fill', aiAssisted: Boolean(aiResult) },
    steps: packaging.steps.map((s) => {
      const item = items[s.itemIndex];
      return {
        contentItemId: item._id,
        order: s.itemIndex,
        durationSec: estimateStepDurationSec(domain, item),
        instruction: s.instruction,
        label: item.payload?.title || item.payload?.name,
        url: item.payload?.url || item.payload?.demoRef || null,
        completedAt: null,
      };
    }),
  };
}

function estimateStepDurationSec(domain, item) {
  if (domain === 'dsa') return item.estMinutes * 60;
  // fitness: sets * (a few seconds per rep + restSec) as a rough timer seed
  const p = item.payload;
  const workSec = (p.sets || 1) * ((p.reps || 1) * 3);
  const restSec = (p.sets || 1) * (p.restSec || 0);
  return workSec + restSec;
}

// ---- Full mission-candidate generation (all 3 variants, packaged) ---------

export async function generateMissionVariants(userId, domain, timeBudgetMin) {
  const { topic, difficulty, ideal, minimum, rescue } = selectCandidates(userId, domain, timeBudgetMin);

  const [idealPkg, minimumPkg, rescuePkg] = await Promise.all([
    packageVariant(domain, topic, difficulty, ideal.items),
    packageVariant(domain, topic, difficulty, minimum.items),
    packageVariant(domain, topic, difficulty, rescue.items),
  ]);

  return {
    topic,
    difficulty,
    variants: {
      ideal: { ...idealPkg, estMinutes: ideal.estMinutes },
      minimum: { ...minimumPkg, estMinutes: minimum.estMinutes },
      rescue: { ...rescuePkg, estMinutes: rescue.estMinutes },
    },
  };
}
