# CAM-LLM Benchmark — site

Static leaderboard for the CAM-LLM benchmark. Landing view ranks models by
metric wins with prompt-variant filter tabs; `#model=<name>` opens a per-model
task/variant/run drill-down. Metric columns are grouped and toggleable.
PIN-gated.

**This repo holds only the site + `summary.json` (aggregates).** Raw
`eval_results` jsonl stay on the local machine and are never committed.

## How it updates
`summary.json` is regenerated from local `eval_results` and pushed; Cloudflare
Pages auto-deploys on push. Two triggers:
- **Auto** — finishing a run (scoring is automatic, no manual grading step)
  runs `update.ps1` (build → commit → push) via `leaderboard/auto_deploy.py`,
  which every run entry point fires unless `--no-deploy` is passed.
- **Manual** — `..\update.ps1` (build + commit + push on demand).

## One-time setup
1. Private GitHub repo; this folder is its working tree (`git init`, add remote, push).
2. Git creds for non-interactive push (`gh auth login` or a stored PAT).
3. Cloudflare → Create Pages project → **Connect to Git** → pick this repo.
4. Pages → Settings → Variables and secrets: `SITE_PIN` (the PIN), `SITE_SECRET`
   (random string for cookie signing).

## Files
- `index.html`, `app.js` — the UI (reads `summary.json`, lazy-loads `runs/<id>.json`)
- `functions/_middleware.js` — PIN gate (Cloudflare Pages Function)
- `summary.json` — generated aggregates (committed)
- `runs/<run_id>.json` — per-run detail: metric values, tool-call transcript,
  produced-CAM summary, provenance (committed; fetched on demand)

This folder is the frontend SOURCE. `scripts/update.ps1` copies it into the
deploy repo (`BENCH_SITE_DIR`) alongside the generated data, then pushes — so
edit here, never in the deploy repo.
