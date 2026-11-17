/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS hooks load the browser TypeScript modules directly in Node. */
const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Run the actual browser modules with the project's installed TypeScript compiler.
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const events = new EventTarget();
const stored = new Map();
global.window = {
  localStorage: { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) },
  dispatchEvent: events.dispatchEvent.bind(events), addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
};
global.Image = class { naturalWidth = 100; naturalHeight = 100; async decode() {} };
global.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, drawImage() {} }), toDataURL: () => 'data:image/jpeg;base64,/9j/AAAA' }) };
const storage = require('../lib/browser/storage.ts');
const deposits = require('../lib/browser/deposits.ts');
const rewards = require('../lib/browser/rewards.ts');
const selectors = require('../lib/browser/selectors.ts');
const { initialState, collectionPoints } = require('../lib/browser/data.ts');
const key = 'revessel.browser.v1';
const request = () => crypto.randomUUID();
const form = (values) => { const result = new FormData(); for (const [key, value] of Object.entries(values)) result.set(key, value); return result; };
const photo = () => new File(['photo'], 'bottle.png', { type: 'image/png' });
const submission = (id = request()) => form({ requestId: id, point: collectionPoints[0].slug, material: collectionPoints[0].materials[0], quantity: '30', photo: photo() });
async function actor(id, role = 'resident') {
  await storage.changeState((state) => {
    if (!state.accounts.some((account) => account.id === id)) state.accounts.push({ id, role, name: id, email: `${id}@example.test`, createdAt: new Date().toISOString() });
    state.session = { mode: 'account', id };
  });
}
beforeEach(() => { stored.set(key, JSON.stringify(initialState())); delete navigator.locks; });

test('register, case-insensitive login, wrong-password denial, and persisted account', async () => {
  assert.equal((await storage.registerAccount('Ayu', 'AYU@example.test', 'secure-pass')).role, 'resident');
  const id = storage.currentProfile(storage.readState()).id;
  await storage.logoutAccount();
  assert.ok((await storage.loginAccount('ayu@example.test', 'wrong')).error);
  assert.equal((await storage.loginAccount(' AYU@example.test ', 'secure-pass')).role, 'resident');
  assert.equal(storage.currentProfile(storage.readState()).id, id);
  assert.ok((await storage.registerAccount('Ayu', 'ayu@example.test', 'secure-pass')).error);
});

test('photo requirement, approval, owner denial, dropoff, receive, points, redemption and handover', async () => {
  await actor('ayu');
  const invalid = submission(); invalid.delete('photo');
  assert.ok((await deposits.createDeposit(invalid)).error);
  const input = submission();
  const created = await deposits.createDeposit(input);
  assert.equal(created.deposit.status, 'pending_approval');
  const code = created.deposit.code;
  assert.equal((await deposits.createDeposit(input)).deposit.code, code);
  assert.ok((await deposits.chooseFulfillment(code, form({ method: 'dropoff' }))).error);
  assert.ok((await deposits.decideApproval(code, form({ decision: 'approve' }))).error);
  await actor('bima');
  assert.ok((await deposits.cancelDeposit(code)).error);
  assert.ok((await deposits.attachDepositPhoto(code, form({ photo: photo() }))).error);
  await actor('admin', 'admin');
  assert.equal((await deposits.decideApproval(code, form({ decision: 'approve' }))).deposit.status, 'approved');
  assert.ok((await deposits.submitReview(code, form({ verified: 'on' }))).error);
  await actor('ayu');
  assert.equal((await deposits.chooseFulfillment(code, form({ method: 'dropoff' }))).success, true);
  await actor('admin', 'admin');
  assert.ok((await deposits.submitReview(code, form({}))).error);
  assert.equal((await deposits.submitReview(code, form({ verified: 'on' }))).deposit.status, 'accepted');
  assert.ok((await deposits.submitReview(code, form({ verified: 'on' }))).error);
  await actor('ayu');
  let workspace = storage.readState().workspaces.account;
  assert.equal(selectors.residentRewards(workspace, 'ayu').balance, 30);
  const reward = workspace.rewards[0]; const id = request();
  const claim = await rewards.redeemReward(reward.id, id);
  assert.ok(claim.code);
  assert.equal((await rewards.redeemReward(reward.id, id)).code, claim.code);
  workspace = storage.readState().workspaces.account;
  assert.equal(workspace.claims.filter((entry) => entry.owner === 'ayu').length, 1);
  assert.equal(selectors.residentRewards(workspace, 'ayu').balance, 30 - reward.cost);
  assert.ok((await rewards.handOverReward({}, form({ code: claim.code }))).error);
  await actor('admin', 'admin');
  assert.ok((await rewards.handOverReward({}, form({ code: claim.code }))).message);
  assert.equal(storage.readState().workspaces.account.claims.find((entry) => entry.code === claim.code).fulfilled, true);
});

test('pickup consent, cancellation removes contact data, rejection needs reason', async () => {
  await actor('ayu');
  const { deposit } = await deposits.createDeposit(submission());
  await actor('admin', 'admin');
  assert.ok((await deposits.decideApproval(deposit.code, form({ decision: 'reject' }))).error);
  await deposits.decideApproval(deposit.code, form({ decision: 'approve' }));
  await actor('ayu');
  const pickup = { method: 'pickup', address: 'Jalan Mawar nomor 123', phone: '081234567890' };
  assert.ok((await deposits.chooseFulfillment(deposit.code, form(pickup))).error);
  assert.equal((await deposits.chooseFulfillment(deposit.code, form({ ...pickup, share: 'on' }))).success, true);
  assert.equal(storage.readState().workspaces.account.deposits[0].pickup.phone, pickup.phone);
  assert.equal((await deposits.cancelDeposit(deposit.code)).success, true);
  assert.equal(storage.readState().workspaces.account.deposits[0].pickup, undefined);
  await actor('admin', 'admin');
  assert.ok((await deposits.submitReview(deposit.code, form({ verified: 'on' }))).error);
});

test('queued mutation cannot execute as another resident after account switch', async () => {
  await actor('ayu');
  let execute;
  navigator.locks = { request: (_key, callback) => new Promise((resolve) => { execute = () => resolve(callback()); }) };
  const pending = rewards.redeemReward(storage.readState().workspaces.account.rewards[0].id, request());
  const state = JSON.parse(stored.get(key));
  state.session.id = 'resident-demo';
  stored.set(key, JSON.stringify(state));
  execute();
  assert.ok((await pending).error);
  assert.equal(storage.readState().workspaces.account.claims.length, state.workspaces.account.claims.length);
});

test('simultaneous redemption cannot overspend points or duplicate a request', async () => {
  await actor('resident-demo');
  const initial = storage.readState().workspaces.account;
  const reward = initial.rewards[0];
  const balance = selectors.residentRewards(initial, 'resident-demo').balance;
  const stock = reward.stock;
  const id = request();
  const results = await Promise.all([
    rewards.redeemReward(reward.id, id), rewards.redeemReward(reward.id, id),
    rewards.redeemReward(reward.id, request()), rewards.redeemReward(reward.id, request()),
  ]);
  assert.equal(results[0].code, results[1].code);
  const final = storage.readState().workspaces.account;
  assert.equal(selectors.residentRewards(final, 'resident-demo').balance, balance - reward.cost);
  assert.equal(final.rewards[0].stock, stock - 1);
  assert.ok(results[2].error);
  assert.ok(results[3].error);
});

test('rejected and adjusted submissions award no points and cannot be reopened', async () => {
  await actor('ayu');
  const rejected = (await deposits.createDeposit(submission())).deposit;
  const adjusted = (await deposits.createDeposit(submission())).deposit;
  await actor('admin', 'admin');
  assert.equal((await deposits.decideApproval(rejected.code, form({ decision: 'reject', note: 'Foto belum sesuai.' }))).deposit.status, 'rejected');
  assert.ok((await deposits.decideApproval(rejected.code, form({ decision: 'approve' }))).error);
  await deposits.decideApproval(adjusted.code, form({ decision: 'approve' }));
  await actor('ayu');
  await deposits.chooseFulfillment(adjusted.code, form({ method: 'dropoff' }));
  await actor('admin', 'admin');
  assert.equal((await deposits.submitReview(adjusted.code, form({ reason: 'Ada botol yang retak atau pecah.' }))).deposit.status, 'adjustment');
  await actor('ayu');
  assert.equal(selectors.residentRewards(storage.readState().workspaces.account, 'ayu').balance, 0);
  assert.ok((await deposits.cancelDeposit(adjusted.code)).error);
});

test('quick admin access sees a registered resident submission in the same workspace', async () => {
  await storage.registerAccount('Ayu', 'ayu@example.test', 'secure-pass');
  const created = await deposits.createDeposit(submission());
  await storage.logoutAccount();
  await storage.enterDemo('admin');
  assert.equal(storage.currentProfile(storage.readState()).mode, 'account');
  assert.equal(deposits.lookupDeposit(created.deposit.code).deposit.code, created.deposit.code);
});

test('legacy ledgers merge once without losing unique deposits, claims, contacts, or stock accounting', () => {
  const { unifyWorkspaces } = require('../lib/browser/workspaces.ts');
  const state = initialState();
  delete state.workspaceVersion;
  state.session = { mode: 'account', id: 'resident-demo' };
  const legacy = state.workspaces.demo;
  legacy.deposits.unshift({ ...legacy.deposits[0], item: { ...legacy.deposits[0].item, code: 'RV-DEADBEEF' }, requestId: request() });
  legacy.claims.unshift({ ...legacy.claims[0], code: 'RW-DEADBEEF0001', requestId: request() });
  legacy.messages.unshift({ ...legacy.messages[0], id: 'legacy-contact' });
  const rewardId = legacy.claims[0].rewardId;
  const originalStock = state.workspaces.account.rewards.find((reward) => reward.id === rewardId).stock;
  unifyWorkspaces(state);
  assert.ok(state.workspaces.account.deposits.some((row) => row.item.code === 'RV-DEADBEEF'));
  assert.ok(state.workspaces.account.claims.some((row) => row.code === 'RW-DEADBEEF0001'));
  assert.ok(state.workspaces.account.messages.some((row) => row.id === 'legacy-contact'));
  assert.equal(state.workspaces.account.rewards.find((reward) => reward.id === rewardId).stock, originalStock - 1);
  const migrated = JSON.stringify(state);
  unifyWorkspaces(state);
  assert.equal(JSON.stringify(state), migrated);
  assert.ok(state.workspaces.demo.deposits.some((row) => row.item.code === 'RV-DEADBEEF'));
});

test('active legacy ledger wins collisions, keeps the other record archived, and migrates the session', () => {
  const state = initialState();
  delete state.workspaceVersion;
  state.session = { mode: 'demo', id: 'resident-demo' };
  state.workspaces.demo.deposits[0].item.quantity = 17;
  state.workspaces.account.deposits[0].item.quantity = 23;
  const stock = state.workspaces.demo.rewards[0].stock;
  stored.set(key, JSON.stringify(state));
  const loaded = storage.readState();
  assert.equal(loaded.session.mode, 'account');
  assert.equal(loaded.workspaces.account.deposits.find((row) => row.item.code === 'RV-A0000001').item.quantity, 17);
  assert.equal(loaded.workspaces.demo.deposits.find((row) => row.item.code === 'RV-A0000001').item.quantity, 23);
  assert.equal(loaded.workspaces.account.deposits.length, 8);
  assert.equal(loaded.workspaces.account.claims.length, 2);
  assert.equal(loaded.workspaces.account.rewards[0].stock, stock);
});

test('anonymous contact reaches quick admin inbox once and excludes honeypot spam', async () => {
  const { sendContactMessage } = require('../lib/browser/contact.ts');
  const id = request();
  const message = form({ name: 'Ayu', email: 'ayu@example.test', subject: 'Jadwal setoran', message: 'Kapan saya bisa mengantar botol?' });
  assert.equal((await sendContactMessage(id, message)).success, true);
  assert.equal((await sendContactMessage(id, message)).success, true);
  message.set('website', 'spam');
  await sendContactMessage(request(), message);
  await storage.enterDemo('admin');
  const profile = storage.currentProfile(storage.readState());
  const messages = storage.readState().workspaces[profile.mode].messages;
  assert.equal(messages.filter((entry) => entry.id === id).length, 1);
  assert.equal(messages.length, 2);
  assert.equal(messages.find((entry) => entry.id === id).owner, undefined);
});

test('queued contact cannot acquire another account identity after session switch', async () => {
  const { sendContactMessage } = require('../lib/browser/contact.ts');
  let execute;
  navigator.locks = { request: (_key, callback) => new Promise((resolve) => { execute = () => resolve(callback()); }) };
  const id = request();
  const pending = sendContactMessage(id, form({ name: 'Ayu', email: 'ayu@example.test', subject: 'Setoran', message: 'Kapan saya bisa mengantar botol?' }));
  const state = JSON.parse(stored.get(key));
  state.session = { mode: 'account', id: 'resident-demo' };
  stored.set(key, JSON.stringify(state));
  execute();
  assert.ok((await pending).error);
  assert.ok(!storage.readState().workspaces.account.messages.some((entry) => entry.id === id));
});
