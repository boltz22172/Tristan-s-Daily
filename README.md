# Tristan's Daily

## Markdown 渲染重构
- 数学公式改为 markdown-it 渲染阶段完成（KaTeX 插件），不再依赖对整棵 DOM 的事后扫描。
- 支持：`$...$`、`\(...\)`、`$$...$$`、`\[...\]`。
- 保留代码高亮（highlight.js），并避免公式污染 code/pre/iframe 区域。
- 高亮继续支持 `==text==`。
- 下划线支持：`++text++`（ins）与 `{{u:text}}`（custom underline）。
- 新增注释块语法：
  :::comment
  注释内容
  :::
  注释块支持 Markdown、公式、高亮、下划线。

## 其他
- 设置中心（⚙）：语言/主题/字体/背景图/渲染区透明度
- 本地存储：`tristan_entries_v6`、`tristan_uploads_v6`、`tristan_settings_v1`
