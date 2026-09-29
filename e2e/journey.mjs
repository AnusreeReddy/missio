import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || 'playwright');

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const email = `e2e_${Date.now()}@example.com`;
const errors = [];
let step = 0;
const ok = (m) => console.log(`  ✓ ${++step}. ${m}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });

async function must(cond, msg) { if (!cond) { await page.screenshot({ path: '/tmp/fail.png' }); throw new Error('FAILED: ' + msg); } }

// signup
await page.goto(BASE);
await page.waitForURL('**/login');
await page.click('text=New here?');
await page.fill('input[type=email]', email);
await page.fill('input[type=password]', 'password123');
await page.click('button[type=submit]');
await page.waitForURL('**/onboarding');
ok('signup -> onboarding');

// onboarding: pick both goals
await page.click('text=Interview / DSA prep');
await page.click('text=Fitness / exercise');
await page.click('text=Generate today');
await page.waitForSelector('text=Start mission');
ok('onboarding -> Today with missions');

const cards = await page.locator('text=Start mission').count();
await must(cards === 2, `expected 2 missions, got ${cards}`);
ok('2 missions generated (DSA + workout)');

// variant switching on DSA card
const firstCard = page.locator('div', { has: page.locator('h3') }).filter({ hasText: 'DSA' }).last();
await page.click('button:has-text("Rescue") >> nth=0');
await page.waitForTimeout(400);
ok('switched first mission to Rescue variant');
await page.click('button:has-text("Ideal") >> nth=0');
await page.waitForTimeout(300);

// run DSA mission
await page.click('text=Start mission >> nth=0');
await page.waitForURL('**/missions/*');
await page.waitForSelector('text=step 1');
ok('Execution mode opened');
await page.click('button:has-text("Start timer")');
await page.waitForTimeout(1200);
const timerText = await page.locator('[aria-live=polite]').innerText();
await must(!/^\d+:\d+$/.test(timerText) === false, 'timer text');
ok('timer runs (' + timerText + ')');

for (let i = 0; i < 10; i++) {
  if (await page.locator('text=MISSION COMPLETE').count()) break;
  const finish = page.locator('button:has-text("Finish mission")');
  if (await finish.count()) { await finish.click(); }
  else await page.click('button:has-text("next step")');
  await page.waitForTimeout(350);
}
await page.waitForSelector('text=MISSION COMPLETE');
ok('mission completed');

await page.click('text=Back to Today');
await page.waitForSelector('text=Completed');
ok('Today shows completed status');

// progress
await page.click('text=Progress');
await page.waitForSelector('text=Arrays');
ok('Progress shows completed topic (Arrays)');
await page.click('text=← Today');

// check-in low sleep + low water
await page.click('text=Quick check-in');
await page.fill('input[placeholder="7"]', '4');
await page.fill('input[placeholder="1.5"]', '0.3');
await page.click('button:has-text("2")');
await page.click('text=Save check-in');
await page.waitForSelector('text=Update today');
ok('check-in saved');

// adaptive planning: plan for tomorrow via API using token from localStorage
const token = await page.evaluate(() => localStorage.getItem('missio_token'));
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const plan = await (await fetch(`${BASE}/api/plan/${tomorrow}`, { headers: { Authorization: `Bearer ${token}` } })).json();
const variants = plan.missions.map((m) => `${m.domain}:${m.variant}`);
await must(plan.missions.some((m) => m.domain === 'health'), 'hydration nudge missing');
await must(plan.missions.filter((m) => m.domain !== 'health').every((m) => m.variant === 'minimum'), 'expected minimum variants ' + variants);
await must(plan.missions.find((m) => m.domain === 'dsa').topic !== 'arrays', 'topic should rotate off arrays');
ok('adaptive plan: ' + variants.join(', ') + ' (topic rotated to ' + plan.missions.find((m) => m.domain === 'dsa').topic + ')');

// logout/login
await page.click('text=Log out');
await page.waitForURL('**/login');
await page.fill('input[type=email]', email);
await page.fill('input[type=password]', 'password123');
await page.click('button[type=submit]');
await page.waitForSelector('text=Completed');
ok('logout -> login restores state');

// wrong password
await page.click('text=Log out');
await page.fill('input[type=email]', email);
await page.fill('input[type=password]', 'wrongpass');
await page.click('button[type=submit]');
await page.waitForSelector('text=Invalid email or password');
ok('bad login shows error');

await browser.close();
if (errors.length) { console.log('\nBrowser errors:\n' + errors.join('\n')); process.exit(1); }
console.log('\nALL E2E CHECKS PASSED');
