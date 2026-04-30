# Tristan's Daily

Static journal site prototype with Markdown compose/preview, category timeline, featured list, i18n (中文/English), and theme switching.

## Publish to your custom domain

This repository is preconfigured for GitHub Pages with a custom domain:

- Domain in `CNAME`: `tristandaily040127.com`
- Workflow: `.github/workflows/deploy-pages.yml`

### One-time GitHub settings

1. Open repository **Settings → Pages**.
2. In **Build and deployment**, set **Source** to **GitHub Actions**.
3. Ensure your DNS records point to GitHub Pages:
   - `A` records for root domain to GitHub Pages IPs.
   - `www` as `CNAME` to `<your-github-username>.github.io` (optional).
4. Wait for DNS propagation (can take minutes to 48 hours).

### Deploy flow

- Push commits to branch `work`.
- GitHub Action `Deploy static site to GitHub Pages` runs automatically.
- After successful run, site is available at:
  - `https://tristandaily040127.com/`

## Local preview

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.
