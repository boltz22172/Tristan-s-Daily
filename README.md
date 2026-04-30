# Tristan's Daily

## 修复说明
1. Markdown 数学渲染链路重构为 `markdown-it + markdown-it-texmath + KaTeX`。
2. 同时启用 `dollars` 与 `brackets` 分隔符，稳定支持：
   - 行内：`$...$`、`\(...\)`
   - 行间：`$$...$$`、`\[...\]`
3. 保留 `markdown-it-mark`、`markdown-it-ins`、`markdown-it-container(comment)` 与 highlight.js。
4. 移除仓库 `CNAME`，暂时禁用自定义域名跳转，优先恢复 `https://boltz22172.github.io/Tristan-s-Daily/` 可访问性。

## 存储键
- `tristan_entries_v6`
- `tristan_uploads_v6`
- `tristan_settings_v1`
