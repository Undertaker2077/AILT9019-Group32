'use strict';

function createDemoApi(storage, loadFixtures) {
  const key = 'study-calendar-course-demo-v1';
  const demoName = 'SYNTH101 — Fictional Computing';
  let scan;
  let scanId = 0;

  function saveTask(state, data, existing) {
    if (!state.courses.some(course => course.id === data.course_id) || !data.title.trim()) {
      throw new Error('A course and task title are required.');
    }
    const task = {
      id: existing?.id ?? state.nextId++,
      version: (existing?.version ?? 0) + 1,
      course_id: data.course_id,
      title: data.title.trim(),
      date: data.date || '',
      time: data.date ? data.time || '' : '',
      tentative: Boolean(data.tentative),
      progress: data.progress ?? 0,
      weight: data.weight || '',
      notes: data.notes || ''
    };
    if (existing) state.tasks[state.tasks.indexOf(existing)] = task;
    else state.tasks.push(task);
    return task;
  }

  return async (path, method = 'GET', data = {}) => {
    const fixtures = path === '/api/scan' || path === '/api/extract' ? await loadFixtures() : null;
    const state = JSON.parse(storage.getItem(key) || 'null') ||
      {courses: [], tasks: [], proposals: [], nextId: 1};
    const calendar = {app: 'ai-study-calendar', timezone: 'Asia/Hong_Kong', courses: state.courses, tasks: state.tasks};
    const commit = result => {
      storage.setItem(key, JSON.stringify(state));
      return result;
    };
    const route = method + ' ' + path;

    switch (route) {
      case 'GET /api/state':
      case 'GET /api/export':
        return calendar;
      case 'GET /api/settings':
        return {base_url: '', model: '', key_configured: false};
      case 'GET /api/proposals':
        return state.proposals;
      case 'POST /api/demo': {
        const existing = state.courses.find(course => course.demo);
        if (existing) return {course_id: existing.id};
        const course = {id: state.nextId++, name: demoName, color: '#427864', demo: true};
        state.courses.push(course);
        return commit({course_id: course.id});
      }
      case 'POST /api/scan': {
        if (data.files || !state.courses.some(course => course.id === data.course_id && course.demo)) {
          throw new Error('Load the fictional demo course before previewing.');
        }
        scan = {id: ++scanId, courseId: data.course_id};
        return {
          scan_id: scan.id,
          documents: fixtures.documents.map(doc => ({
            ...doc,
            previously_processed: state.proposals.some(p => p.course_id === scan.courseId && p.sha256 === doc.sha256)
          })),
          errors: []
        };
      }
      case 'POST /api/extract': {
        if (data.mode !== 'replay' || !scan || data.scan_id !== scan.id || !data.hashes?.length ||
            !state.courses.some(course => course.id === scan.courseId)) {
          throw new Error('Preview and select fictional documents for fixture replay.');
        }
        const selected = fixtures.documents.filter(doc => data.hashes.includes(doc.sha256));
        const results = selected.map(doc => {
          const recorded = fixtures.replay[doc.sha256]?.tasks;
          if (!recorded) return {filename: doc.filename, status: 'failed', error: 'No recorded output.'};
          let count = 0;
          for (const item of recorded) {
            const existing = state.proposals.find(p => p.course_id === scan.courseId && p.sha256 === doc.sha256 &&
              p.payload.task_key === item.task_key);
            if (existing && !(existing.status === 'rejected' && data.force)) continue;
            const payload = {...item, warnings: [], date: item.date || '', time: item.time || ''};
            if (existing) existing.status = 'pending';
            else state.proposals.push({
              id: state.nextId++, course_id: scan.courseId, sha256: doc.sha256, filename: doc.filename,
              payload, status: 'pending', mode: 'replay', model: 'Fictional fixture', possible_matches: []
            });
            count++;
          }
          return {filename: doc.filename, status: count ? 'processed' : 'unchanged', tasks: count};
        });
        return commit({results, calendar_changed: false});
      }
    }

    const decision = path.match(/^\/api\/proposals\/(\d+)\/decision$/);
    if (method === 'POST' && decision) {
      const proposal = state.proposals.find(p => p.id === Number(decision[1]) && p.status === 'pending');
      if (!proposal) throw new Error('This candidate is no longer pending.');
      if (data.decision === 'reject') {
        proposal.status = 'rejected';
        return commit({proposal});
      }
      if (data.decision !== 'accept' || !data.match_ack) throw new Error('Please confirm that you reviewed the source.');
      const target = state.tasks.find(task => task.id === data.target_id && task.course_id === proposal.course_id);
      if (data.target_id && (!target || target.version !== data.expected_version)) throw new Error('Refresh and review the latest task.');
      const sourceNotes = [
        proposal.filename, 'SHA-256: ' + proposal.sha256,
        ...proposal.payload.requirements,
        ...proposal.payload.evidence.map(item => item.locator + ' · ' + item.quote)
      ].join('\n');
      const task = saveTask(state, {
        ...target, ...data.patch, course_id: proposal.course_id,
        notes: [target?.notes, sourceNotes].filter(Boolean).join('\n\n')
      }, target);
      proposal.status = 'accepted';
      return commit({task});
    }

    const record = path.match(/^\/api\/(tasks|courses)(?:\/(\d+))?$/);
    if (!record || !['POST', 'PUT', 'DELETE'].includes(method)) throw new Error('Unavailable in the course demo.');
    const [, collection, id] = record;
    const entries = state[collection];
    const existing = entries.find(entry => entry.id === Number(id));
    if (method !== 'POST' && !existing) throw new Error('Record not found.');
    if (existing && collection === 'tasks' && existing.version !== data.expected_version) {
      throw new Error('Refresh and review the latest task.');
    }
    if (method === 'DELETE') {
      if (collection === 'courses' && [state.tasks, state.proposals].some(rows => rows.some(row => row.course_id === existing.id))) {
        throw new Error('This course has tasks or review history.');
      }
      entries.splice(entries.indexOf(existing), 1);
      return commit({deleted: existing.id});
    }
    if (collection === 'tasks') return commit(saveTask(state, data, existing));
    const name = data.name.trim();
    if (!name || !/^#[a-f0-9]{6}$/i.test(data.color)) throw new Error('A course name and color are required.');
    const course = existing || {id: state.nextId++};
    Object.assign(course, {name, color: data.color});
    if (!existing) entries.push(course);
    return commit(course);
  };
}

if (typeof module !== 'undefined') module.exports = {createDemoApi};
