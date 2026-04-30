# Tristan's Daily (Rewritten)

This repository was fully rewritten as a static SPA journal app.

## What it does
- Compose Markdown with live preview.
- View entries by category/month.
- Mark and view featured entries.
- Save button writes to GitHub repo:
  - `entries/YYYY/MM/<slug>.md`
  - `data/entries.json`

## Required config
`app.js` already sets:
- owner: `boltz22172`
- repo: `Tristan-s-Daily`
- branch: `work`

## Save flow
1. Write content.
2. Click `保存`.
3. Enter GitHub PAT when prompted.
4. Confirm success message appears.

## Acceptance checklist
1. Single `保存` button only.
2. Can click notes from 分类 and 精选 to reopen + edit.
3. Save creates/updates markdown file and index JSON.
4. Theme and language switch work.
