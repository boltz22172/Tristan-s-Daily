# Tristan's Daily

## Desert Ink 主题（沙漠苍凉古风）
- 中文字体：楷体链（`STKaiti`/`KaiTi`）
- 英文字体：`Georgia`
- 背景：沙漠照片 + 暖黄纸面卡片 + 深浅墨色层次
- 组件重绘：按钮、卡片、预览区、侧栏统一风格

## 本次功能调整
1. 上传区新增元数据保存：上传 md 可选择“随想/工作日志”+“是否精选”后保存到文档。
2. 上传 pdf 的行为已限制为：**仅浏览 + 删除**（不能编辑、不能保存为文档）。
3. PDF 浏览采用页面内 iframe 预览。
4. Markdown 继续采用 markdown-it + KaTeX + highlight.js。

## 存储
- 本地存储：`localStorage`
- 键：`tristan_entries_v5`、`tristan_uploads_v5`
