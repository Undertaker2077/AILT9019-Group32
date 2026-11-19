const assert = require('node:assert/strict');
const {test} = require('node:test');
const {createDemoApi} = require('./calendar.js');
const fixtures = require('./fixtures.json');

test('fictional replay requires review and persists without duplicate tasks', async () => {
  const storage = new Map();
  const create = () => createDemoApi({
    getItem: key => storage.get(key),
    setItem: (key, value) => storage.set(key, value)
  }, async () => fixtures);
  const api = create();
  const {course_id} = await api('/api/demo', 'POST', {});
  const scan = await api('/api/scan', 'POST', {course_id});
  assert.equal(scan.documents.length, 4);
  const lab = scan.documents.find(doc => doc.filename === '01-lab-brief.txt');
  const request = {scan_id: scan.scan_id, hashes: [lab.sha256], mode: 'replay'};
  await assert.rejects(api('/api/extract', 'POST', {...request, mode: 'live'}));
  await api('/api/extract', 'POST', request);
  assert.equal((await api('/api/state')).tasks.length, 0);
  const [proposal] = await api('/api/proposals');
  const decision = '/api/proposals/' + proposal.id + '/decision';
  await assert.rejects(api(decision, 'POST', {decision: 'accept'}));
  await api(decision, 'POST', {decision: 'accept', match_ack: true, patch: proposal.payload});
  const reloaded = create();
  const [task] = (await reloaded('/api/state')).tasks;
  assert.equal(task.date, '2026-10-26');
  assert.equal(task.time, '17:00');
  assert.match(task.notes, /line 4/);
  const newScan = await reloaded('/api/scan', 'POST', {course_id});
  await reloaded('/api/extract', 'POST', {...request, scan_id: newScan.scan_id, force: true});
  assert.equal((await reloaded('/api/proposals')).length, 1);
  const edit = { ...task, expected_version: task.version, progress: 50 };
  await reloaded('/api/tasks/' + task.id, 'PUT', edit);
  await assert.rejects(reloaded('/api/tasks/' + task.id, 'PUT', edit));
  assert.equal((await create()('/api/state')).tasks[0].progress, 50);
});
