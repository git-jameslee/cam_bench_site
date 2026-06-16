# CAM-LLM Benchmark — site

Static leaderboard for the CAM-LLM benchmark. One table per task; rows = models;
columns = the metrics `eval_middleware` logs (grouped, toggleable). PIN-gated.

**This repo holds only the site + `summary.json` (aggregates).** Raw
`eval_results` jsonl stay on the local machine and are never committed.

## How it updates
`summary.json` is regenerated from local `eval_results` and pushed; Cloudflare
Pages auto-deploys on push. Two triggers:
- **Auto** — finishing or grading a run runs `update.ps1` (build → commit → push)
  via the hook in `eval_middleware.py` / `score_run.py`.
- **Manual** — `..\update.ps1` (build + commit + push on demand).

## One-time setup
1. Private GitHub repo; this folder is its working tree (`git init`, add remote, push).
2. Git creds for non-interactive push (`gh auth login` or a stored PAT).
3. Cloudflare → Create Pages project → **Connect to Git** → pick this repo.
4. Pages → Settings → Variables and secrets: `SITE_PIN` (the PIN), `SITE_SECRET`
   (random string for cookie signing).

## Files
- `index.html`, `app.js` — the table UI (reads `summary.json`)
- `functions/_middleware.js` — PIN gate (Cloudflare Pages Function)
- `summary.json` — generated aggregates (committed)
