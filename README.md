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

Use this checklist to verify quality:

1. **导航与页面切换**
   - Compose / 分类 / 精选 three tabs all switch correctly.
2. **Markdown 编辑预览**
   - Typing in textarea updates preview in real-time.
3. **分类正确性**
   - 类型筛选（全部/随想/工作）生效。
   - 年月分组正常，点击条目可回填到编辑器。
4. **精选正确性**
   - 勾选精选后，内容出现在精选页。
5. **中英切换**
   - nav 与筛选文案可切换 zh/en。
6. **主题切换**
   - 亮/暗主题切换后颜色变量生效。
7. **云端发布**
   - 点击发布后状态显示“发布成功”。
   - GitHub 仓库 `data/entries.json` 确实变化。
8. **部署结果**
   - push 后 Pages 自动部署成功。
   - `https://tristandaily040127.com/` 可访问最新内容。

## Local preview

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.
