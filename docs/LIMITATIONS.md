# Known limitations

- This is a local single-user course prototype, not a hosted multi-user service.
- Scanning is manual. Periodic scanning proposed for later work is not implemented. The app does not log in to Moodle, fetch notices, read email or submit coursework.
- Supported inputs: text PDFs (at most 40 pages), ordinary DOCX, UTF-8 TXT/Markdown. Limit: 2 MB/file, 20 files per preview; browser upload additionally limits the total to 10 MB. Only 10 selected hashes are processed per extraction request. Scanned PDFs, encrypted PDFs, OCR, EML and images are unsupported.
- Models may miss tasks or misunderstand relevant dates. Exact quotations/locators are validated, but a quotation alone does not prove semantic correctness. All candidates require human review.
- Date support is deliberately conservative: ISO dates, explicit English full/abbreviated month dates and common Chinese year/month/day forms. A date whose year is not explicitly supported remains blank; relative dates are not inferred. Ambiguous or unsupported times remain blank.
- Stable task identifiers and exact same-title warnings provide basic matching. Semantically different titles can still evade duplicate detection. Choose a target deliberately and do not treat suggestions as authoritative reconciliation.
- Requirements are retained only when each item occurs in a matching source quotation, but they are not guaranteed exhaustive and still require human interpretation.
- API availability/model names, key validity, service expiry and quota depend on the provider. Live mode sends selected extracted text to that provider. Replay is stored synthetic output and cannot process arbitrary new files.
- JSON export exists, but no JSON restore UI, ICS export, system-calendar sync or background operation after shutdown is implemented.
- Timetable and assessment datasets are empty by default. They remain optional JSON configuration, not automatic analysis of course-outline grading weights.
- Windows/macOS launchers and filesystem abstractions are present; Windows real-device browser/folder-open verification remains pending. CI configuration alone is not a passed CI run.
- The source checker is bounded to known key patterns, identifying strings and package paths; it is not a universal secret scanner or a legal clearance review.
