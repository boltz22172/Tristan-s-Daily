# Tristan's Daily

## 本次改动
1. 新增 `>` 引用块增强：连续多行以 `>` 开头且中间无空行，会自动保持为同一个引用块。
2. 注释块支持 Markdown、公式、高亮、下划线。
3. Reader 页面新增目录（TOC），可按标题自动跳转。
4. 撰写页顶部新增：诗句、公历日期、农历日期、天气（通过浏览器定位 + open-meteo 获取）。
5. 美术细节：背景图缩放到原来的 90%，设置区下拉和透明度滑杆宽度缩到 90%，渲染区支持半透明+可调+可缩放。

## 数学与渲染
- markdown-it + markdown-it-texmath + KaTeX
- 支持 `$...$`、`\(...\)`、`$$...$$`、`\[...\]`
- 保留 highlight.js / mark / ins / comment

## GitHub 直连同步
本项目现在支持网页直接写入 GitHub：

1. 在 GitHub 创建 fine-grained personal access token。
2. Token 只给 `boltz22172/Tristan-s-Daily` 仓库权限。
3. Repository permissions 里给 `Contents` 设置 `Read and write`。
4. 打开网页设置，填写：
   - `GitHub Token`
   - `GitHub 用户`：`boltz22172`
   - `GitHub 仓库`：`Tristan-s-Daily`
   - `GitHub 分支`：`main`
5. 点击“从 GitHub 载入”。

启用后，保存文章会写入 `entries/YYYY/MM/*.md` 和 `data/entries.json`；上传 PDF 并保存为文档时，会写入 `uploads/YYYY/MM/*.pdf`。

注意：Token 会保存在当前浏览器的 `localStorage` 里，适合个人自用，不适合公开给别人共同使用。
