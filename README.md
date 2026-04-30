# Tristan's Daily

## 当前实现（方案B）

- 无登录：任何访问者都可编辑。
- 一个按钮：`保存`。
- 保存动作会自动把内容写入 GitHub 仓库：
  - 日志正文：`entries/YYYY/MM/<slug>.md`
  - 索引文件：`data/entries.json`

## 使用前配置

在 `app.js` 顶部修改：

```js
const REPO_CONFIG = { owner: 'YOUR_GITHUB_OWNER', repo: 'Tristan-s-Daily', branch: 'work' };
```

将 `owner` 改成你的 GitHub 用户名。

## 如何保存

1. 在撰写页输入标题、日期、类型和正文。
2. 点击 `保存`。
3. 首次会弹窗要求输入 GitHub PAT（需要 repo 内容写权限）。
4. 成功后页面显示 `保存成功：entries/.../.md`。

## 网页检查指标（验收）

1. **保存按钮**
   - 页面底部只保留一个 `保存` 按钮。
2. **保存到 md 文件**
   - 保存后 GitHub 仓库新增或更新 `entries/YYYY/MM/*.md`。
3. **索引同步**
   - 保存后 `data/entries.json` 同步更新 `title/date/type/featured/filePath/lastEdited`。
4. **笔记可点开编辑（bug 修复）**
   - 分类页点击任一笔记，可回到撰写页并回填内容。
   - 精选页点击“打开并编辑”也可回填。
5. **线上可渲染**
   - push 后 Pages 部署成功，刷新域名页面可看到最新条目。

## 本地预览

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.
