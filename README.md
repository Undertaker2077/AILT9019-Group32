# AILT9019-Group32

## AI Study Calendar

A local, review-first study planner for fictional/public course documents. Python + SQLite backend, browser interface, Windows and macOS launchers. No Node build step or account login is required.

**Workflow:** choose course files → preview extracted text → explicitly choose live API or fixture replay → inspect candidate tasks and exact source quotations → confirm → calendar.

This is a course prototype. AI suggestions are fallible; original course instructions remain authoritative. The repository contains only team-authored fictional examples. Your documents, database and API configuration are local and excluded from version control.

## Quick start

Install Python **3.11 or newer**. Clone/download this repository and extract it to a writable folder.

**Windows**

Double-click `Setup-Windows.bat` once, then `Start-Windows.bat`. Alternatively:

```powershell
py -3 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe launcher.py --demo
```

**macOS**

If the downloaded scripts are not executable, open Terminal in the project folder and run `chmod +x Setup-Mac.command Start-Mac.command` once. Double-click `Setup-Mac.command`, then `Start-Mac.command`. Alternatively:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python launcher.py --demo
```

Open **http://localhost:3458**. Keep the launcher terminal open; Ctrl+C stops a server started by that launcher. If the port is occupied, use `launcher.py --port 3460`. No admin privileges are needed. Terminal commands are the fallback if your OS does not associate the double-click scripts with a terminal.

A fresh installation starts with an empty calendar. `--demo` or the in-app **Load fictional demo course** button adds a fictional course and associates the bundled example folder; it does not create tasks or call AI.

## Reproduce the core path without a key

1. Open **AI import** and click **Load fictional demo course**.
2. Click **Preview text and changes**. All four bundled documents are displayed with their extracted text and source locators.
3. Select only `01-lab-brief.txt`. Choose **Fixture replay (stored outputs, not live AI)** and click **Extract review candidates**.
4. Verify that the calendar is still empty. Review the proposed `lab-1` task, its deadline quotation and submission requirements.
5. Tick the review acknowledgement and click **Confirm and save to calendar**.
6. Expected result: one task, **Submit Lab 1 report.**, on **2026-10-26 at 17:00, Asia/Hong_Kong**, progress **0%**. Reopen it to inspect the stored filename, hash, locators and quotations. Navigate to October 2026 if your current month differs.
7. Re-run extraction of the same file. It is marked unchanged; no duplicate task is created.

Replay uses `examples/replay.json`, keyed to the complete content hash of known synthetic fixtures. It makes **no model calls**, supports no arbitrary new input, and is visibly labelled. It demonstrates review/storage behavior, not extraction accuracy.

Other examples:

| Input | Expected behavior |
| --- | --- |
| `02-project-brief.pdf` | `project-1`, 2026-11-03 12:00, ZIP with code/README/test log |
| `03-reflection.docx` | `reflection-1`, date and time empty because no deadline was announced |
| `04-reading.md` | No task; a lecture date is not a submission deadline |
| `examples/updates/lab-1-revised.txt` | Proposes a 2026-10-28 update; existing task is unchanged until review; progress is retained |
| `examples/updates/lab-1-conflict.txt` | Shows conflicting dates; explicit acknowledgement is required; no automatic choice |
| `examples/updates/unreadable.pdf` | Reports no readable text; does not invent an OCR result |
| `examples/updates/untrusted-instruction.txt` | Replay has no academic task; document instructions cannot directly write to the calendar |

Use **Choose files** to select an update example. **Choose folder** reads supported files selected through your browser. Alternatively, associate a local path with a course and manually scan it. Hidden files and symbolic links outside the selected directory are skipped. No background scan or automatic API call is performed.

## Live model setup

Open **API settings**. Enter the endpoint, supported model name and your own key; save. Blank key input retains the current key; the clear option removes it. **Test connection** sends one short fictional request and consumes a small amount of provider quota.

For the course-provided Alibaba Cloud Token Plan endpoint:

```text
Base URL: https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1
Model: qwen3.8-flash
API key: enter your own; never include it in the repository
```

Endpoint/model availability depends on the provider and course plan. The backend sends an OpenAI-compatible Chat Completions request, asks for JSON, and validates the response itself. Reference: [Alibaba Cloud structured output documentation](https://www.alibabacloud.com/help/en/model-studio/qwen-structured-output). The app does not require an OpenAI account or SDK.

For live extraction: preview and select files, choose **Live API extraction**, read the destination shown, and explicitly confirm sending **all previewed text of those selected files**. Consent is bound to that preview, its selected hashes and the displayed provider; changing any of them clears consent and the backend rejects stale consent. Only then does the backend send sequential model requests. While those requests run, preview, provider-setting and course-deletion mutations are rejected so they cannot invalidate consent between documents. No filename or document is sent during preview. At most ten selected documents are processed per request. A scan snapshot is used, so text displayed in preview is the text sent even if the source file changes later. Starting a new preview replaces the previous temporary snapshot for that course; startup also prunes duplicate snapshots left by older versions.

The key is stored in ignored `local/config.json` and is never returned through API responses. On macOS the file permissions are restricted to its owner; Windows uses the user's normal filesystem permissions. Environment variables `STUDY_API_BASE`, `STUDY_API_MODEL` and `STUDY_API_KEY` override saved settings. `.env.example` documents these variables; `.env` is not automatically loaded.

## Review and update behavior

- A candidate never creates/changes a task until you confirm it. Rejecting a candidate changes no calendar records.
- Missing dates/times remain empty. Unverifiable model dates/times are cleared and flagged; no default 23:59 or inferred year is added.
- Quotations and locators must match extracted text. Task titles and stable identifiers must occur in the source, and every retained requirement must occur in a matching requirements quotation. Matching text is evidence for review, not a proof that the model interpreted it correctly.
- Exact content duplicates are reused within each course and mode. Stable course/task identifiers suggest updates. Same-title matches are flagged for your decision.
- An update preserves saved progress, weight and existing notes and appends source evidence. It also records before/after history.
- Version checks reject stale suggestions if a user edited the task after extraction. Reject the stale candidate and re-analyse the file with **Re-analyse processed files**, then review again.
- Removing a source file does not remove accepted tasks. There is no automatic coursework submission, account login or calendar synchronization.

## Tests and source checks

Use the virtual environment's Python:

```sh
python -m unittest discover -s tests -v
python scripts/check_submission.py
```

On macOS replace `python` with `.venv/bin/python`; on Windows use `.venv\Scripts\python.exe` if the environment is not activated. Tests use temporary databases and mocks; they need no API key and do not alter your working calendar. See [testing and compatibility](docs/TESTING.md), [architecture](docs/ARCHITECTURE.md), [limits](docs/LIMITATIONS.md) and [AI use / contributions](docs/AI_USE.md).

GitHub Actions is configured for Windows, macOS and Linux, Python 3.11 and 3.13. A workflow file is not evidence that a remote run passed; check the actual Actions results after pushing. Windows desktop/browser verification is recorded separately.

## Data and sharing

`data/study.sqlite3` contains tasks, scan snapshots, candidates and history. `local/config.json` contains local API settings. Both directories, caches and virtual environments are ignored. Export creates a local JSON backup of tasks/courses plus the displayed timetable/assessment/calendar data; **there is no import/restore UI**. Keep a database backup before manual restoration.

Use `python scripts/package_submission.py` to create an allowlisted source ZIP under ignored `output/`. It excludes your database, keys, local paths, virtual environment and Git metadata. Review the resulting manifest before sharing. No open-source license has been selected; consult the team before publishing or granting reuse rights. Course assessment can use a private team repository with staff access.

## 中文操作提示

先运行对应系统的Setup脚本，再运行Start脚本。进入“AI导入”→“载入虚构示例课程”→“预览文本与变化”。无key可选明确标记的“示例回放”；真实AI须在“API设置”填写自己的配置，并确认文本发送范围。核对来源、日期和冲突后，再点击“确认写入日历”。所有时间按香港时区解释。请勿把真实个人资料、实际API key或数据库提交到仓库。
