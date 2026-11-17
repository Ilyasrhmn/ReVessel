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
const submission = (id = request()) => form({ requestId: id, point: collectionPoints[0].slug, material: collectionPoints[0].materials[0], estimatedWeightGrams: '2900', photo: photo() });
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
  assert.match((await deposits.submitReview(code, form({ verified: 'on' }))).error, /berat bersih/i);
  assert.match((await deposits.submitReview(code, form({ verified: 'on', weightGrams: '3.5' }))).error, /berat bersih/i);
  const accepted = (await deposits.submitReview(code, form({ verified: 'on', weightGrams: '3099' }))).deposit;
  assert.equal(accepted.status, 'accepted');
  assert.equal(accepted.weightGrams, 3099);
  assert.equal(accepted.estimatedWeightGrams, 2900);
  assert.ok((await deposits.submitReview(code, form({ verified: 'on' }))).error);
  await actor('ayu');
  let workspace = storage.readState().workspaces.account;
  assert.equal(selectors.residentRewards(workspace, 'ayu').balance, 30);
  const reward = workspace.rewards.find(({ cost }) => cost === 25); const id = request();
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
  await storage.changeState((state) => {
    const entries = state.workspaces.account.deposits;
    const weighted = entries.find((row) => row.item.weightGrams > 10_000);
    weighted.item.weightGrams = 26_500;
    state.workspaces.account.deposits = entries.filter((row) => row === weighted || !row.item.weightGrams || row.item.weightGrams < 10_000);
    delete state.workspaces.account.cashouts;
    delete state.workspaces.account.cashRedemptions;
  });
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
  assert.equal(loaded.workspaces.account.deposits.length, state.workspaces.demo.deposits.length);
  assert.equal(loaded.workspaces.account.claims.length, state.workspaces.demo.claims.length);
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

test('withdraw all reserves the wallet once and leaves points intact', async () => {
  const { requestCashout, reviewCashout } = require('../lib/browser/cashouts.ts');
  await actor('resident-demo');
  const workspace = () => storage.readState().workspaces.account;
  const totals = () => selectors.residentRewards(workspace(), 'resident-demo');
  assert.equal(totals().balance, 1537);
  assert.equal(totals().cashBalance, 150000);
  assert.equal(totals().paidCash, 200000);
  assert.equal(totals().pendingCash, 0);
  assert.deepEqual(totals().cashouts.map(({ amount }) => amount), [100000, 50000, 50000]);
  assert.ok(totals().activity.some(({ weightGrams, points }) => weightGrams === 2400 && points === 24));
  assert.ok((await requestCashout(request(), 150001)).error);
  assert.ok((await requestCashout(request(), 50000)).error);
  assert.ok(workspace().deposits.every(({ item }) => /^RV-[A-F0-9]{8}$/.test(item.code)));
  assert.ok((await requestCashout(request(), 49999)).error);
  assert.ok((await requestCashout(request(), 50000.5)).error);
  const id = request();
  const results = await Promise.all([requestCashout(id, 150000), requestCashout(id, 150000), requestCashout(request(), 150000)]);
  const code = results[0].code;
  assert.ok(code);
  assert.equal(results[1].code, code);
  assert.ok(results[2].error);
  assert.equal(workspace().cashouts.length, 4);
  assert.equal(totals().balance, 1537);
  assert.equal(totals().cashBalance, 0);
  assert.equal(totals().pendingCash, 150000);
  assert.equal(totals().paidCash, 200000);
  assert.ok((await reviewCashout(code, 'paid')).error);
  await actor('someone-else');
  assert.ok((await reviewCashout(code, 'cancelled')).error);
  assert.deepEqual(selectors.residentRewards(workspace(), 'someone-else').cashouts, []);
  await actor('admin', 'admin');
  assert.equal((await reviewCashout(code, 'paid')).success, true);
  assert.equal((await reviewCashout(code, 'paid')).success, true);
  assert.ok((await reviewCashout(code, 'rejected')).error);
  assert.equal(totals().paidCash, 350000);
  assert.equal(totals().pendingCash, 0);
  assert.equal(totals().balance, 1537);
  assert.equal(totals().cashBalance, 0);
  await actor('resident-demo');
  assert.ok((await reviewCashout(code, 'cancelled')).error);
});

test('default dashboard data has distinct activity across comparison periods', () => {
  const workspace = initialState().workspaces.account;
  const now = Date.now();
  const records = (start, end) => workspace.deposits.filter(({ item }) => {
    const age = (now - Date.parse(item.createdAt)) / 86400000;
    return age >= start && age < end;
  });
  const weighed = (rows) => rows.reduce((total, { item }) => total + (item.weightGrams ?? 0), 0);
  const current = records(0, 30);
  const previous = records(30, 60);
  assert.equal(current.length, 21);
  assert.equal(previous.length, 10);
  assert.equal(weighed(current), 297200);
  assert.equal(weighed(previous), 308000);
  assert.equal(new Set(previous.map(({ item }) => item.material)).size, 5);
  for (const range of [7, 90, 365]) {
    assert.ok(records(0, range).length > 0);
    assert.ok(records(range, range * 2).length > 0);
    assert.notEqual(weighed(records(0, range)), weighed(records(range, range * 2)));
  }
});

test('older browsers receive the built-in wallet once and a later zero balance stays zero', async () => {
  const { requestCashout, reviewCashout } = require('../lib/browser/cashouts.ts');
  const state = initialState();
  const account = state.workspaces.account;
  const personal = { ...account.deposits[0], owner: 'resident-personal', requestId: request() };
  personal.item = { ...personal.item, code: 'RV-CAFE1234' };
  delete personal.reviewedAt;
  account.deposits = [...account.deposits.filter(({ item }) => /^RV-A000000[1-8]$/.test(item.code)), personal];
  delete account.demoWalletSeeded;
  delete account.cashRedemptions;
  for (const entry of account.cashouts) {
    delete entry.fromWallet;
    entry.cost = entry.amount === 50000 ? 1250 : 2500;
  }
  stored.set(key, JSON.stringify(state));
  const workspace = () => storage.readState().workspaces.account;
  const totals = () => selectors.residentRewards(workspace(), 'resident-demo');
  assert.equal(totals().cashBalance, 150000);
  assert.equal(totals().balance, 1537);
  assert.equal(workspace().cashouts.length, 3);
  assert.equal(workspace().cashRedemptions.length, 7);
  assert.deepEqual(workspace().deposits.find(({ owner }) => owner === personal.owner), personal);
  assert.equal(selectors.residentRewards(workspace(), personal.owner).cashBalance, 0);

  await storage.enterDemo('resident');
  const { code } = await requestCashout(request(), 150000);
  assert.ok(code);
  await storage.enterDemo('admin');
  assert.equal((await reviewCashout(code, 'paid')).success, true);
  const raw = stored.get(key);
  stored.delete(key);
  storage.readState();
  stored.set(key, raw);
  assert.equal(totals().cashBalance, 0);
  assert.equal(workspace().cashRedemptions.length, 7);
});

test('previous built-in history separates paid cash without altering the available balance', async () => {
  const state = initialState();
  const workspace = state.workspaces.account;
  workspace.cashRedemptions = workspace.cashRedemptions.filter(({ requestId }) => requestId !== 'seed-cash-6');
  workspace.cashouts = workspace.cashouts.filter(({ code }) => code !== 'CU-A00000000003');
  workspace.deposits = workspace.deposits.filter(({ item }) => !['RV-A0000042', 'RV-A0000043'].includes(item.code));
  const prior = selectors.residentRewards(workspace, 'resident-demo');
  stored.set(key, JSON.stringify(state));
  await storage.enterDemo('resident');
  const upgraded = selectors.residentRewards(storage.readState().workspaces.account, 'resident-demo');
  assert.equal(upgraded.balance, prior.balance);
  assert.equal(upgraded.cashBalance, prior.cashBalance);
  assert.equal(upgraded.paidCash, 200000);
  await storage.enterDemo('resident');
  assert.equal(storage.readState().workspaces.account.cashouts.length, 3);
  assert.equal(storage.readState().workspaces.account.cashRedemptions.length, 7);
});

test('rejected and cancelled cashouts restore cash once and leave legacy balances unchanged', async () => {
  const { requestCashout, reviewCashout } = require('../lib/browser/cashouts.ts');
  await actor('resident-demo');
  const workspace = () => storage.readState().workspaces.account;
  const points = () => selectors.residentRewards(workspace(), 'resident-demo');
  const first = await requestCashout(request(), 150000);
  assert.equal(points().cashBalance, 0);
  await actor('admin', 'admin');
  assert.equal((await reviewCashout(first.code, 'rejected')).success, true);
  assert.equal((await reviewCashout(first.code, 'rejected')).success, true);
  assert.equal(points().balance, 1537);
  await actor('resident-demo');
  assert.equal(points().cashBalance, 150000);
  const second = await requestCashout(request(), 150000);
  assert.equal(points().pendingCash, 150000);
  assert.equal((await reviewCashout(second.code, 'cancelled')).success, true);
  assert.equal(points().cashBalance, 150000);
  assert.equal(points().pendingCash, 0);
  assert.equal(points().paidCash, 200000);
  assert.equal(points().activity.filter(({ points }) => points === 1250).length, 0);
  assert.equal(points().activity.filter(({ points }) => points === -1250).length, 7);
  await storage.changeState((state) => {
    const account = state.workspaces.account;
    delete account.cashRedemptions;
    const prior = account.cashouts.find(({ status, amount }) => status === 'paid' && amount === 50000);
    account.cashouts = [{ ...prior, fromWallet: undefined, cost: 1250 }];
  });
  assert.equal(points().balance, 9037);
  assert.equal(points().cashBalance, 0);
  assert.equal(points().paidCash, 50000);
  assert.ok((await requestCashout(request(), 50000)).error);
});


test('updated reward prices preserve saved claims and catalogue stock', async () => {
  const state = initialState();
  state.session = { id: 'resident-demo', mode: 'account' };
  const workspace = state.workspaces.account;
  const jar = workspace.rewards.find(({ cost }) => cost === 125);
  const seedling = workspace.rewards.find(({ cost }) => cost === 25);
  jar.name = 'Wadah kaca pakai ulang';
  jar.cost = 12;
  jar.stock = 3;
  seedling.name = 'Bibit tanaman';
  seedling.cost = 8;
  for (const claim of workspace.claims.filter(({ rewardId }) => rewardId === seedling.id)) {
    delete claim.rewardName;
    claim.cost = 8;
  }
  stored.set(key, JSON.stringify(state));

  const catalogue = storage.readState().workspaces.account.rewards;
  assert.equal(catalogue.find(({ id }) => id === jar.id).name, 'Stoples kaca rekondisi 250 ml');
  assert.equal(catalogue.find(({ id }) => id === jar.id).cost, 125);
  assert.equal(catalogue.find(({ id }) => id === jar.id).stock, 3);
  assert.equal(catalogue.find(({ id }) => id === seedling.id).cost, 25);

  assert.ok((await rewards.redeemReward(seedling.id, request())).code);
  const updated = storage.readState().workspaces.account;
  const history = selectors.residentRewards(updated, 'resident-demo').redemptions;
  assert.equal(history.find(({ requestId, cost }) => requestId && cost === 25).name, 'Bibit cabai siap tanam (1 polybag)');
  assert.equal(history.filter(({ kind }) => kind === 'cash').length, 7);
  assert.ok(history.some(({ name, cost, fulfilled }) => name === 'Stoples kaca rekondisi 250 ml' && cost === 125 && fulfilled));
  assert.equal(history.filter(({ name, cost }) => name === 'Bibit tanaman' && cost === 8).length, 2);
  const totals = selectors.residentRewards(updated, 'resident-demo');
  assert.equal(totals.balance, 1546);
  assert.equal(totals.cashBalance, 150000);
});


test('cash reward can be saved and withdrawn later or exchanged and withdrawn atomically', async () => {
  const { redeemCash, requestCashout, reviewCashout } = require('../lib/browser/cashouts.ts');
  await actor('resident-demo');
  const get = () => selectors.residentRewards(storage.readState().workspaces.account, 'resident-demo');
  const initial = storage.readState();
  const hold = await requestCashout(request(), 150000);
  assert.ok((await redeemCash(request(), 50000)).error);
  assert.equal(get().balance, 1537);
  await reviewCashout(hold.code, 'cancelled');
  assert.ok((await redeemCash(request(), 50000)).error);
  const id = request();
  assert.equal((await redeemCash(id)).success, true);
  assert.equal((await redeemCash(id)).success, true);
  assert.ok((await redeemCash(id, 250000)).error);
  assert.ok((await redeemCash(request())).error);
  assert.equal(get().balance, 287);
  assert.equal(get().cashBalance, 200000);
  assert.equal(get().cashouts.filter(({ status }) => status === 'pending').length, 0);
  assert.ok((await requestCashout(request(), 200000)).code);

  stored.set(key, JSON.stringify(initial));
  const immediate = request();
  assert.equal((await redeemCash(immediate, 200000)).success, true);
  assert.equal((await redeemCash(immediate, 200000)).success, true);
  assert.equal(get().cashBalance, 0);
  assert.equal(get().balance, 287);
  const pending = get().cashouts.filter(({ status }) => status === 'pending');
  assert.equal(pending.length, 1);
  assert.equal(pending[0].amount, 200000);
  await actor('admin', 'admin');
  assert.equal((await reviewCashout(pending[0].code, 'paid')).success, true);
  assert.equal(get().paidCash, 400000);
});
