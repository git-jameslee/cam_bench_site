// app.js — renders bench_site/summary.json into per-task tables.
// Columns are grouped (outcome / post / subjective / tokens / time); each group
// has a show/hide toggle. Cells show mean with an optional 95% bootstrap CI.

const DASH = "—";
const GROUP_LABEL = {
  outcome: "Outcome", post: "Objective", subjective: "Subjective",
  tokens: "Tokens", time: "Time", other: "Other",
};

let DATA = null;
let active = "Overview";
let visible = new Set();

const $ = (s) => document.querySelector(s);
const showCI = () => $("#ci").checked;

function compact(n) {
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (a >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return "" + Math.round(n);
}

function fmtMain(fmt, v) {
  if (fmt === "pct") return Math.round(v * 100) + "%";
  if (fmt === "count") return Number.isInteger(v) ? "" + v : v.toFixed(1);
  if (fmt === "tokens") return compact(v);
  if (fmt === "secs") return v.toFixed(1) + "s";
  if (fmt === "score1") return v.toFixed(1);
  return v.toFixed(2); // score2
}

function fmtRange(fmt, lo, hi) {
  if (fmt === "pct") return `[${Math.round(lo * 100)}–${Math.round(hi * 100)}]`;
  if (fmt === "count") return `[${Math.round(lo)}–${Math.round(hi)}]`;
  if (fmt === "tokens") return `[${compact(lo)}–${compact(hi)}]`;
  if (fmt === "secs") return `[${lo.toFixed(1)}–${hi.toFixed(1)}]`;
  if (fmt === "score1") return `[${lo.toFixed(1)}–${hi.toFixed(1)}]`;
  return `[${lo.toFixed(2)}–${hi.toFixed(2)}]`;
}

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k === "title") n.title = v;
    else n.setAttribute(k, v);
  }
  for (const kid of kids) if (kid != null) n.append(kid);
  return n;
}

function renderOverview() {
  const ov = DATA.overview;
  const panel = $("#panel");
  panel.replaceChildren();
  panel.append(el("h2", {}, "Coverage"));
  panel.append(el("div", { class: "note" },
    "Runs per model × task, and whether manual (objective / subjective) scores are graded."));

  const table = el("table");
  const head = el("tr");
  head.append(el("th", {}, "model"));
  ov.tasks.forEach((t) => head.append(el("th", {}, t)));
  table.append(el("thead", {}, head));
  const body = el("tbody");
  ov.models.forEach((m) => {
    const tr = el("tr");
    tr.append(el("td", { class: "model" }, m));
    ov.tasks.forEach((t) => {
      const c = ov.cells[m][t];
      let txt = DASH, dash = true;
      if (c && c.runs) {
        const tag = c.graded ? `${c.graded} graded` : "ungraded";
        txt = `${c.runs} run${c.runs !== 1 ? "s" : ""}, ${tag}`;
        dash = false;
      }
      tr.append(el("td", { class: dash ? "dash" : "" }, txt));
    });
    body.append(tr);
  });
  table.append(body);
  panel.append(el("div", { class: "scroll" }, table));
  panel.append(el("div", { class: "note" },
    "Cross-vendor caveat: tokens / time are not comparable between remote-API models (Claude, GPT) and locally-served ones (Qwen, Gemma)."));
}

function renderTask(name) {
  const task = DATA.tasks.find((t) => t.name === name);
  const cols = task.metrics.filter((m) => visible.has(m.group));
  const panel = $("#panel");
  panel.replaceChildren();
  panel.append(el("h2", {}, name));

  const table = el("table");
  const head = el("tr");
  head.append(el("th", {}, "model"));
  head.append(el("th", {}, "runs"));
  let prevGroup = null;
  cols.forEach((m) => {
    const th = el("th", { title: `${m.group} · ${m.key}` }, m.label);
    if (m.group !== prevGroup) { th.classList.add("grp"); prevGroup = m.group; }
    head.append(th);
  });
  table.append(el("thead", {}, head));

  let anyDash = false;
  const body = el("tbody");
  task.models.forEach((mod) => {
    const tr = el("tr");
    tr.append(el("td", { class: "model" }, mod.model));
    tr.append(el("td", {}, "" + mod.runs));
    cols.forEach((m) => {
      const c = mod.cells[m.key];
      if (c == null || c.mean == null) {
        anyDash = true;
        tr.append(el("td", { class: "dash" }, DASH));
        return;
      }
      const td = el("td", {}, fmtMain(m.fmt, c.mean));
      if (showCI() && c.lo != null) td.append(el("span", { class: "ci" }, " " + fmtRange(m.fmt, c.lo, c.hi)));
      tr.append(td);
    });
    body.append(tr);
  });
  table.append(body);
  panel.append(el("div", { class: "scroll" }, table));
  if (anyDash) {
    panel.append(el("div", { class: "note" },
      "“—” = ungraded (manual objective / subjective scores still null) or not logged for that model."));
  }
}

function render() {
  if (active === "Overview") renderOverview();
  else renderTask(active);
  document.querySelectorAll(".tab").forEach((b) =>
    b.classList.toggle("active", b.dataset.name === active));
}

function buildGroupToggles() {
  const present = new Set();
  DATA.tasks.forEach((t) => t.metrics.forEach((m) => present.add(m.group)));
  const order = DATA.group_order.filter((g) => present.has(g));
  visible = new Set(DATA.default_visible.filter((g) => present.has(g)));
  const box = $("#groups");
  box.replaceChildren();
  order.forEach((g) => {
    const cb = el("input", { type: "checkbox" });
    cb.checked = visible.has(g);
    cb.onchange = () => { cb.checked ? visible.add(g) : visible.delete(g); render(); };
    box.append(el("label", {}, cb, GROUP_LABEL[g] || g));
  });
}

function buildTabs() {
  const tabs = $("#tabs");
  tabs.replaceChildren();
  ["Overview", ...DATA.tasks.map((t) => t.name)].forEach((name) => {
    const b = el("button", { class: "tab", "data-name": name }, name);
    b.onclick = () => { active = name; render(); };
    tabs.append(b);
  });
}

async function init() {
  try {
    const res = await fetch("summary.json", { cache: "no-store" });
    DATA = await res.json();
  } catch (e) {
    $("#sub").textContent = "failed to load summary.json";
    return;
  }
  const gen = DATA.generated ? new Date(DATA.generated).toLocaleString() : "?";
  $("#sub").textContent =
    `${DATA.n_runs} runs · ${DATA.overview.models.length} models · ${DATA.tasks.length} tasks · built ${gen}`;
  $("#ci").addEventListener("change", render);
  buildGroupToggles();
  buildTabs();
  render();
}

init();
