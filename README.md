# Tristan's Daily
Static journal site prototype with Markdown compose/preview, category timeline, featured list, i18n (中文/English), and theme switching.

## Publish to your custom domain
- Domain in `CNAME`: `tristandaily040127.com`
- Workflow: `.github/workflows/deploy-pages.yml`

## V1.1 (方案B): public editing + publish to repo
Current mode intentionally has **no login**. Anyone opening the site can edit in-browser and publish by providing GitHub repo settings + PAT token.

### How publish works
1. Edit content in Compose.
2. Click `保存到站内数据` to update in-memory entries.
3. Fill GitHub settings:
   - owner
   - repo
   - branch
   - PAT token (repo content write permission)
4. Click `发布到 GitHub`.
5. App updates `data/entries.json` through GitHub Contents API.

## Acceptance checklist (网页检查指标)
...（保留原内容）

## Local preview
\```bash
python -m http.server 8000
\```
Open `http://localhost:8000`.
