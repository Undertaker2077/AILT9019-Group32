'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const output = path.join(root, 'output', 'course-demo');
fs.mkdirSync(output, {recursive: true});

for (const name of ['style.css', 'i18n.js', 'app.js', 'workflow.js', 'timetable.json', 'assessments.json', 'academic-calendar.json']) {
  fs.copyFileSync(path.join(root, 'dist', name), path.join(output, name));
}
for (const [source, destination] of [
  ['calendar.js', 'demo-calendar.js'], ['start.js', 'demo-start.js'],
  ['fixtures.json', 'demo-fixtures.json'], ['style.css', 'demo.css']
]) {
  fs.copyFileSync(path.join(__dirname, source), path.join(output, destination));
}

const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8')
  .replace('</header><div id="load-error"', '</header><p class="demo-notice">课程演示版 · 使用虚构文档，日历任务保存在此浏览器。</p><div id="load-error"')
  .replace('<script src="/app.js"', '<link rel="stylesheet" href="/demo.css"><script src="/demo-calendar.js" defer></script><script src="/demo-start.js" defer></script><script src="/app.js"');
fs.writeFileSync(path.join(output, 'index.html'), html);
