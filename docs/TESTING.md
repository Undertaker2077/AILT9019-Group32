# Verification record

Date: 2026-10-21, Asia/Hong_Kong. These are observed checks, not the final held-out evaluation promised in the proposal.

## Automated tests

**42 tests pass** in the current suite. The original 32-test cross-platform run used a fresh project virtual environment and pinned dependencies; the additional regression tests cover consent scope, preview retention and migration, concurrent workflow mutations, and field-level evidence grounding. The suite treats explicit SQLite and HTTP-response closure as required behavior rather than relying on garbage collection for Windows file release.

The same source at commit `127b3b8` passed all six hosted jobs: Windows, macOS and Ubuntu, each with Python 3.11 and 3.13. See the [successful GitHub Actions run](https://github.com/Undertaker2077/AILT9019-Group32/actions/runs/39546429264). The first macOS runs stalled during server startup; extending the test wait alone did not resolve this. Removing the standard HTTP server's unnecessary reverse DNS lookup resolved startup, and a regression test now checks that local binding requires no hostname lookup. Test startup has a bounded 30-second wait and cleans resources even when setup fails.

```sh
.venv/bin/python -W error::ResourceWarning -m unittest discover -s tests -v
```

Tests cover:

- Fresh empty database; text preview creates no tasks.
- All four supported file formats and source locators.
- Accept/reject behavior, idempotent acceptance and content reuse under changed filenames.
- Missing dates/times, unsupported model dates/times and invalid quotations/locators.
- Deliberate date conflicts, revised dates, progress preservation and stale user edits.
- No live request without consent bound to the exact preview, selected hashes and provider; changing any part invalidates consent.
- Preview, settings and course-deletion mutations are rejected while a multi-document live extraction is running.
- A new preview replaces the previous temporary snapshot for that course; startup migrates legacy duplicates, and a snapshot alone does not prevent course deletion.
- Titles, task identifiers and individual requirements must each occur within one applicable source quotation/unit rather than being assembled across boundaries.
- Task titles/identifiers are source-grounded and unsupported individual requirements are removed.
- Fixture replay refuses new/modified content; unreadable PDFs report a limitation.
- Fake provider failure preserves confirmed tasks; authenticated redirects are refused; TLS verification remains enabled.
- Secret settings never return keys; path traversal and external/hidden source files are excluded.
- HTTP startup without DNS, static resources, creation/review/save, optimistic manual updates, history and Origin boundaries.

The source check and package-content verification exclude local database/configuration, virtual environments, course audit files and identifying strings. Their pattern coverage is bounded; this is not a universal secret-detection claim.

## Real provider checks

Using the course-provided Alibaba Cloud endpoint and `qwen3.8-flash`, one self-authored fictional TXT brief produced a valid task with deadline `2026-10-26 17:00` and three matched quotations. After fixing the ordinary macOS Python certificate environment using certifi (certificate verification remains enabled), the browser workflow also processed the fictional project PDF through the real API.

Observed browser sequence:

1. Previewed the bundled course folder and inspected extracted text metadata.
2. Selected only `02-project-brief.pdf`, chose live API and explicitly confirmed the displayed provider/text destination.
3. Received one candidate: `Submit Project 1 prototype`, deadline `2026-11-03 12:00`, with three matching `page 1` quotations.
4. Confirmed the candidate through the review form.
5. Read back one calendar record at `2026-11-03 12:00`, progress 0%, with source hash/locators in notes.

This proves those small success cases, not a 90%/95% extraction accuracy result. Missing-date/conflict/provider-failure tests use deterministic fixtures or mocks unless explicitly stated above. Initial screenshot transcription yielded authentication failure; using the exact key supplied by the user resolved authentication. No real key is distributed in source or test evidence.

## Compatibility status

| Environment | Status |
| --- | --- |
| macOS, Python 3.14.2, fresh virtual environment | Installation, automated tests and live browser workflow passed |
| macOS, Chrome | TXT/PDF preview and live PDF candidate confirmation/calendar display observed |
| Windows | Hosted automated tests passed with Python 3.11 and 3.13; real-device launcher/browser/folder-open verification pending |
| GitHub Actions | All six Windows/macOS/Linux and Python 3.11/3.13 jobs passed at commit `127b3b8`; run linked above |

The action versions follow the current [checkout](https://github.com/actions/checkout) and [setup-python](https://github.com/actions/setup-python) usage examples; token permissions are limited to `contents: read`.

Before declaring Windows fully verified, a team member should run Setup-Windows.bat and Start-Windows.bat, load replay fixtures, confirm a task, restart to check persistence, select a local folder, test live API with their own key, and check folder opening. Record Windows/Python/browser versions and actual outcomes here. Do not replace pending entries with assumed passes.

## Remaining evaluation

The proposal's 30-document dataset, independent labels, held-out precision/recall, exact deadline accuracy and paired user walkthroughs have not been completed. The bundled development fixtures do not constitute that held-out test set. Member contribution records and the one-page status sheet require genuine team input.
