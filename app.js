// app.js — renders bench_site/summary.json.
// Landing view = Leaderboard, and it is the only top-level view: models ranked
// by metric wins (see eval_etl build_leaderboard) with prompt-variant filter
// tabs, per-task headline cells carrying their sample count, click-to-sort
// column headers (display order only — never the rank), and a collapsed metric
// head-to-head table. Model detail pages (#model=<name>) open in place via the
// hash router and hold the expandable variant × task matrix with grouped metric
// columns (outcome / post / tokens / time) and per-run drill-down. Coverage is
// a secondary view reached from the leaderboard footnote — and the automatic
// fallback when summary.json predates the leaderboard payload.
// Cells show mean with a 95% t-distribution CI.

const DASH = "—";
const GROUP_LABEL = {
  outcome: "Outcome", post: "Objective",
  tokens: "Tokens", time: "Time", other: "Other",
};

// Brand logos (simple-icons, 24x24 viewBox). Rendered inline before the model
// name so they inherit the row text color via currentColor — no external fetch.
const LOGOS = {
  claude: "m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z",
  qwen: "M23.919 14.545 20.817 9.17l1.47-2.544a.56.56 0 0 0 0-.566l-1.633-2.83a.57.57 0 0 0-.49-.283h-6.207L12.487.402a.57.57 0 0 0-.49-.284H8.732a.56.56 0 0 0-.49.284L5.139 5.775h-2.94a.56.56 0 0 0-.49.284L.077 8.887a.56.56 0 0 0 0 .567L3.18 14.83l-1.47 2.545a.56.56 0 0 0 0 .566l1.634 2.83a.57.57 0 0 0 .49.283h6.205l1.47 2.545a.57.57 0 0 0 .49.284h3.266a.57.57 0 0 0 .49-.284l3.104-5.375h2.94a.57.57 0 0 0 .49-.283l1.634-2.828a.55.55 0 0 0-.004-.568M8.733.686l1.634 2.828-1.634 2.828H21.8L20.164 9.17H7.425L5.63 6.06Zm1.306 19.801-6.205-.002 1.634-2.83h3.265L2.201 6.344h3.267q3.182 5.517 6.367 11.032zm10.124-5.66L18.53 12l-6.532 11.315-1.634-2.83c2.129-3.673 4.25-7.351 6.373-11.028h3.592l3.102 5.374z",
  openai: "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z",
  gemini: "M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81",
  autodesk: "m.129 20.202 14.7-9.136h7.625c.235 0 .445.188.445.445 0 .21-.092.305-.21.375l-7.222 4.323c-.47.283-.633.845-.633 1.265l-.008 2.725H24V4.362a.561.561 0 0 0-.585-.562h-8.752L0 12.893V20.2h.129z",
  // GLM — Z.ai brand mark (lobehub icon set), monochrome geometric "Z".
  glm: "M12.105 2L9.927 4.953H.653L2.83 2h9.276zM23.254 19.048L21.078 22h-9.242l2.174-2.952h9.244zM24 2L9.264 22H0L14.736 2H24z",
};

// Brand colors for the colored marks. The monochrome OpenAI/Autodesk marks are
// intentionally omitted → they fall back to currentColor (the row text color),
// so they flip black↔white automatically with the light/dark theme.
const LOGO_COLORS = {
  claude: "#D97757",
  qwen: "#6950EF",
  gemini: "#8E75B2",
};

// Map a model name to a brand-logo key by substring (null → no logo).
function logoKey(name) {
  const s = name.toLowerCase();
  if (/claude|anthropic|sonnet|opus|haiku/.test(s)) return "claude";
  if (/glm|chatglm|zhipu/.test(s)) return "glm";
  if (/qwen/.test(s)) return "qwen";
  if (/gpt|openai|\bo[134]\b/.test(s)) return "openai";
  if (/gemma|gemini|google/.test(s)) return "gemini";
  if (/autodesk|fusion/.test(s)) return "autodesk";
  return null;
}

// Fallback icon for any model without a brand logo (e.g. glm): a rounded-square
// monogram of the model's first letter, drawn in currentColor so it flips with
// the theme like the monochrome brand marks, and sized via the shared .logo rule.
function monogramLogo(name) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "logo mono");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const rect = document.createElementNS(NS, "rect");
  rect.setAttribute("x", "1.6"); rect.setAttribute("y", "1.6");
  rect.setAttribute("width", "20.8"); rect.setAttribute("height", "20.8");
  rect.setAttribute("rx", "5.5");
  rect.setAttribute("fill", "none");
  rect.setAttribute("stroke", "currentColor");
  rect.setAttribute("stroke-width", "1.7");
  rect.setAttribute("opacity", ".4");
  const text = document.createElementNS(NS, "text");
  text.setAttribute("x", "12"); text.setAttribute("y", "12.5");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "central");
  text.setAttribute("fill", "currentColor");
  text.setAttribute("font-family", "'Inter', system-ui, sans-serif");
  text.setAttribute("font-size", "12.5");
  text.setAttribute("font-weight", "600");
  const m = name.match(/[a-z0-9]/i);
  text.textContent = (m ? m[0] : "?").toUpperCase();
  svg.append(rect, text);
  return svg;
}

// A model cell's contents: brand logo when known, otherwise a monogram — every
// model gets an icon — followed by the name.
function modelLabel(name) {
  const frag = document.createDocumentFragment();
  const key = logoKey(name);
  if (key) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "logo");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", LOGOS[key]);
    path.setAttribute("fill", LOGO_COLORS[key] || "currentColor");
    svg.append(path);
    frag.append(svg);
  } else {
    frag.append(monogramLogo(name));
  }
  frag.append(name);
  return frag;
}

let DATA = null;
let active = "Leaderboard";
let variantTab = "all";
let currentModel = null; // set when the #model=<name> route is active
let visible = new Set();
// Display-order sort for the leaderboard table. This NEVER touches the ranking:
// board.models keeps its wins order (and each row keeps its true rank badge);
// sortKey only re-orders the rows on screen. null = the default wins ranking.
let sortKey = null;  // "model" | "wins" | "runs" | "headline" | "task:<group>"
let sortDir = -1;    // -1 descending, 1 ascending
let h2hOpen = false; // metric head-to-head disclosure state

const $ = (s) => document.querySelector(s);
const showCI = () => true;

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

// Short column labels for task groups (full name lives in the tooltip).
function taskShort(name) {
  const m = name.match(/^titan_m(\d+)$/);
  if (m) return "M" + m[1];
  return name;
}

// Footnote marker for a cell whose mean rests on fewer runs than the fullest
// cell in the same column — the leaderboard's own coverage warning, so a thin
// number is never read as a solid one. The legend lives under the table.
function lowNMark(n, expected) {
  return el("span", {
    class: "warn", "aria-label": "incomplete data",
    title: `${n} of ${expected} runs — fewer than the fullest cell in this column; treat as provisional`,
  }, "*");
}

// One cell showing the headline metric's mean (dash when ungraded), with the
// sample count inline (muted, like the CI) and the incomplete-coverage marker
// when `expected` is given and this cell falls short of it.
function headlineCell(H, c, extraClass, title, expected) {
  if (!c || c.mean == null) {
    return el("td", { class: ("dash " + (extraClass || "")).trim() }, DASH);
  }
  const attrs = extraClass ? { class: extraClass } : {};
  if (title) attrs.title = title;
  const td = el("td", attrs, fmtMain(H.fmt, c.mean));
  if (c.n) td.append(el("span", { class: "ci" }, " · n=" + c.n));
  if (expected && c.n && c.n < expected) td.append(lowNMark(c.n, expected));
  return td;
}

// Value a leaderboard row sorts on for a given column key (null → sorts last).
function sortValue(e, key) {
  if (key === "model") return e.model.toLowerCase();
  if (key === "runs") return e.runs;
  if (key === "wins") return e.wins;
  if (key === "headline") return e.headline ? e.headline.mean : null;
  if (key.startsWith("task:")) {
    const c = e.tasks[key.slice(5)];
    return c ? c.mean : null;
  }
  return null;
}

// Rows in display order: the wins ranking by default, otherwise sorted by the
// active column. Each row carries its true (wins-based) rank regardless.
function sortedRows(board) {
  const rows = board.models.map((e, i) => ({ e, rank: i + 1 }));
  if (!sortKey) return rows;
  return rows.sort((a, b) => {
    const x = sortValue(a.e, sortKey), y = sortValue(b.e, sortKey);
    const xn = x == null, yn = y == null;
    if (xn || yn) return xn && yn ? a.rank - b.rank : (xn ? 1 : -1);
    if (typeof x === "string") return sortDir * x.localeCompare(y);
    if (x === y) return a.rank - b.rank; // ties keep the wins order
    return sortDir * (x < y ? -1 : 1);
  });
}

// Three-state header click: sort (best/A-first) → reverse → back to the default
// wins ranking. The model column is the explicit "restore default" too.
function toggleSort(key) {
  const initial = key === "model" ? 1 : -1;
  if (sortKey !== key) { sortKey = key; sortDir = initial; }
  else if (sortDir === initial) { sortDir = -initial; }
  else { sortKey = null; sortDir = -1; }
  render();
}

// A clickable column header carrying the active-sort arrow.
function sortTh(key, label, attrs = {}) {
  const on = sortKey === key;
  const th = el("th", Object.assign({}, attrs, {
    class: [attrs.class, "sortable", on ? "sorted" : ""].filter(Boolean).join(" "),
  }), label);
  th.append(el("span", { class: "sortind" }, on ? (sortDir < 0 ? "▾" : "▴") : ""));
  th.setAttribute("aria-sort", on ? (sortDir < 0 ? "descending" : "ascending") : "none");
  th.onclick = () => toggleSort(key);
  return th;
}

function renderLeaderboard() {
  const lb = DATA.leaderboard;
  const board = lb.boards[variantTab] || lb.boards.all;
  const H = lb.headline;
  const panel = $("#panel");
  panel.replaceChildren();
  panel.append(el("h2", {}, "Leaderboard"));
  panel.append(el("div", { class: "note" },
    `Ranked by metric wins — on how many scoring metrics the model posts the best mean in this view (${board.contested} contested; ties shared) — tiebroken by overall ${H.label}. Task cells show mean ${H.label} · n. Click a model for its detail page; click a column header to re-sort the rows (again to reverse, a third time to restore the wins ranking).`));

  // Prompt-variant filter (the ablation axis): re-filters + re-ranks the board.
  const seg = el("div", { class: "seg" });
  lb.variants.forEach((v) => {
    const b = el("button", { class: "segbtn" + (v === variantTab ? " active" : "") },
      v === "all" ? "All variants" : v);
    b.onclick = () => { variantTab = v; render(); };
    seg.append(b);
  });
  panel.append(seg);

  // Expected run count per column = the fullest cell any model posts there in
  // this view. summary.json carries no declared trials-per-task target, so the
  // best-covered model is the yardstick: anything below it is under-sampled.
  const expTask = {};
  lb.task_groups.forEach((g) => {
    expTask[g] = board.models.reduce(
      (mx, e) => Math.max(mx, (e.tasks[g] && e.tasks[g].n) || 0), 0);
  });
  const expHead = board.models.reduce(
    (mx, e) => Math.max(mx, (e.headline && e.headline.n) || 0), 0);
  let anyLowN = false;

  // Columns: model → headline → per-task → wins → runs. The ranking is
  // untouched; this is layout, and the sort below is display order only.
  const table = el("table");
  const head = el("tr");
  head.append(sortTh("model", "model",
    { title: "sort by name — click again to restore the wins ranking" }));
  head.append(sortTh("headline", H.label + " · overall",
    { class: "grp", title: `mean ${H.key} over every graded run in this view` }));
  lb.task_groups.forEach((g) => head.append(sortTh("task:" + g, taskShort(g), { title: g })));
  head.append(sortTh("wins", "wins", { class: "grp" }));
  head.append(sortTh("runs", "runs"));
  table.append(el("thead", {}, head));

  const body = el("tbody");
  sortedRows(board).forEach(({ e, rank }) => {
    const tr = el("tr");
    // Rank lives inside the sticky model cell so it survives horizontal scroll
    // (and stays with its model when a column sort re-orders the rows).
    // The model name is a real link (middle-click friendly) to its detail page.
    const mcell = el("td", { class: "model" });
    mcell.append(el("span", { class: "rank" }, "" + rank));
    const link = el("a", { class: "mlink",
                           href: "#model=" + encodeURIComponent(e.model),
                           title: "open model page" });
    link.append(modelLabel(e.model));
    mcell.append(link);
    tr.append(mcell);

    const h = e.headline;
    if (h.mean == null) {
      tr.append(el("td", { class: "dash grp" }, DASH));
    } else {
      const attrs = { class: "grp" };
      if (showCI() && h.ci_low != null && h.ci_high != null) {
        attrs.title = `[${fmtMain(H.fmt, h.ci_low)}, ${fmtMain(H.fmt, h.ci_high)}]`;
      }
      const td = el("td", attrs, fmtMain(H.fmt, h.mean));
      if (showCI() && h.ci_margin != null) {
        // Clamped/exact intervals are asymmetric around the mean — render the
        // bracket form then, since "±" implies a centered interval.
        const centered = h.ci_low == null ||
          Math.abs((h.ci_low + h.ci_high) / 2 - h.mean) < 1e-6;
        td.append(el("span", { class: "ci" }, centered
          ? " ±" + fmtMain(H.fmt, h.ci_margin)
          : ` [${fmtMain(H.fmt, h.ci_low)}, ${fmtMain(H.fmt, h.ci_high)}]`));
      }
      if (h.n) td.append(el("span", { class: "ci" }, " · n=" + h.n));
      if (expHead && h.n && h.n < expHead) { td.append(lowNMark(h.n, expHead)); anyLowN = true; }
      tr.append(td);
    }

    lb.task_groups.forEach((g) => {
      const c = e.tasks[g];
      if (expTask[g] && c && c.n && c.n < expTask[g]) anyLowN = true;
      tr.append(headlineCell(H, c, "", g, expTask[g]));
    });

    const wonLabels = e.won.map((k) => {
      const wm = lb.wins_metrics.find((m) => m.key === k);
      return wm ? wm.label : k;
    });
    tr.append(el("td", wonLabels.length ? { class: "grp", title: "won: " + wonLabels.join(", ") }
                                        : { class: "grp" },
      `${e.wins}/${board.contested}`));
    tr.append(el("td", {}, "" + e.runs));
    body.append(tr);
  });
  table.append(body);
  panel.append(el("div", { class: "scroll" }, table));

  // Footnote: the coverage legend for the "*" marker, plus the low-key route to
  // the full coverage matrix (demoted from a peer tab).
  const foot = el("div", { class: "note" });
  if (anyLowN) {
    foot.append(el("span", { class: "warn" }, "*"),
      ` fewer runs than the best-covered model in that column — provisional. `);
  }
  foot.append("n = graded runs behind each mean. ");
  const covBtn = el("button", { class: "linkbtn", type: "button" }, "data coverage");
  covBtn.onclick = () => { active = "Coverage"; render(); };
  foot.append("Full runs-per-model × task matrix: ", covBtn, ".");
  panel.append(foot);

  // Head-to-head: every scoring metric × ranked models, winners marked. This is
  // the wins column's receipts — collapsed by default so the landing view is
  // one table.
  const h2hHead = el("button", { class: "detail-h disclosure" + (h2hOpen ? " open" : ""),
                                 type: "button", "aria-expanded": h2hOpen ? "true" : "false" },
    el("span", { class: "caret" }, "▸"), "Metric head-to-head");
  const h2hBox = el("div", { class: h2hOpen ? "" : "hidden" });
  h2hHead.onclick = () => {
    h2hOpen = !h2hOpen;
    h2hHead.classList.toggle("open", h2hOpen);
    h2hHead.setAttribute("aria-expanded", h2hOpen ? "true" : "false");
    h2hBox.classList.toggle("hidden", !h2hOpen);
  };
  panel.append(h2hHead, h2hBox);
  const h2h = el("table", { class: "subtable" });
  const hh = el("tr");
  hh.append(el("th", {}, "metric"));
  board.models.forEach((e) => hh.append(el("th", {}, modelLabel(e.model))));
  h2h.append(el("thead", {}, hh));
  const hb = el("tbody");
  lb.wins_metrics.forEach((m) => {
    const cells = board.models.map((e) => e.metrics[m.key] || { mean: null, n: 0 });
    if (!cells.some((c) => c.n > 0)) return; // nothing graded in this view
    const contested = cells.filter((c) => c.n > 0).length >= 2;
    const r = el("tr");
    r.append(el("td", { title: `${m.section} · ${m.key}` },
      m.label + " ", el("span", { class: "args" }, m.direction > 0 ? "↑" : "↓")));
    board.models.forEach((e, idx) => {
      const c = cells[idx];
      if (c.mean == null) { r.append(el("td", { class: "dash" }, DASH)); return; }
      const winner = contested && e.won.includes(m.key);
      const td = el("td", { title: `n=${c.n}`, class: winner ? "win" : "" },
        fmtMain(m.fmt, c.mean));
      if (winner) td.prepend(el("span", { class: "winmark" }, "● "));
      r.append(td);
    });
    hb.append(r);
  });
  h2h.append(hb);
  h2hBox.append(el("div", { class: "scroll" }, h2h));
  h2hBox.append(el("div", { class: "note" },
    "Models stay in rank order here. ↑ higher is better, ↓ lower is better. ● = best mean in this view (a win; ties share it; a metric only 1 model has data for is uncontested). Curated scoring metrics only — token / time diagnostics never count toward wins."));
}

// Always show all three ablation variants under a task, even unrun ones.
const VARIANT_ORDER = ["minimal", "explicit", "detailed"];

// Model detail page (#model=<name>, opened in place from the leaderboard via
// the hash router, and directly shareable): logo + name header, then a task
// accordion — click a task to reveal its three prompt variants, click a variant
// to lazy-load that variant's runs with the transcript / produced-CAM
// drill-down. "← Leaderboard" clears the hash, so Back/Forward both work.
function renderModel(name) {
  const lb = DATA.leaderboard;
  const H = lb.headline;
  const panel = $("#panel");
  panel.replaceChildren();

  // href="#" (not a reload) so the hash router handles it and Back/Forward keep
  // stepping between the leaderboard and this page.
  panel.append(el("a", { class: "backlink", href: "#" }, "← Leaderboard"));
  const head = el("div", { class: "model-head" });
  head.append(modelLabel(name));
  panel.append(head);

  const all = lb.boards.all;
  const idx = all.models.findIndex((x) => x.model === name);
  const allEntry = idx >= 0 ? all.models[idx] : null;
  if (allEntry) {
    const bits = [`rank #${idx + 1}`, `${allEntry.runs} runs`,
                  `wins ${allEntry.wins}/${all.contested}`];
    if (allEntry.headline.mean != null) {
      const hd = allEntry.headline;
      const hciCentered = hd.ci_low == null ||
        Math.abs((hd.ci_low + hd.ci_high) / 2 - hd.mean) < 1e-6;
      bits.push(`${H.label} ${fmtMain(H.fmt, hd.mean)}` +
        (hd.ci_margin == null ? ""
          : hciCentered ? ` ±${fmtMain(H.fmt, hd.ci_margin)}`
          : ` [${fmtMain(H.fmt, hd.ci_low)}, ${fmtMain(H.fmt, hd.ci_high)}]`));
    }
    panel.append(el("div", { class: "note" }, bits.join(" · ") + " (all variants)"));
  }

  panel.append(el("div", { class: "detail-h" }, "Tasks"));
  panel.append(el("div", { class: "note" },
    `Click a task for its prompt variants, then a variant to load that variant's runs (metrics, transcript, produced CAM). ${H.label} is shown at every level.`));

  const table = el("table");
  const hrow = el("tr");
  ["task", "runs", H.label].forEach((h) => hrow.append(el("th", {}, h)));
  table.append(el("thead", {}, hrow));
  const body = el("tbody");
  const mtx = lb.matrix[name] || {};
  let any = false;

  lb.task_groups.forEach((g) => {
    // One slot per canonical variant (kept even when unrun, so the ablation
    // grid is visible), plus a fallback slot for a suffix-less task name.
    const slots = VARIANT_ORDER.map((v) => {
      const t = DATA.tasks.find((x) => x.name === g + "_" + v);
      const mod = t && t.models.find((m) => m.model === name);
      return { v, task: t, runIndex: (mod && mod.run_index) || [],
               iou: (mtx[v] || {})[g] };
    });
    const bare = DATA.tasks.find((x) => x.name === g);
    if (bare) {
      const mod = bare.models.find((m) => m.model === name);
      if (mod && (mod.run_index || []).length) {
        slots.push({ v: "(no variant)", task: bare, runIndex: mod.run_index, iou: null });
      }
    }
    const total = slots.reduce((s, p) => s + p.runIndex.length, 0);
    if (!total) return; // this model never ran the task
    any = true;

    const trow = el("tr", { class: "expandable" });
    const tcell = el("td", { class: "model" });
    tcell.append(el("span", { class: "caret" }, "▸"), g);
    trow.append(tcell);
    trow.append(el("td", {}, "" + total));
    trow.append(headlineCell(H, allEntry && allEntry.tasks[g], "",
      `mean ${H.label} across all variants`));
    body.append(trow);

    const tdetail = el("tr", { class: "detail hidden" });
    const tdcell = el("td", { class: "detailcell", colspan: "3" });
    const vt = el("table", { class: "subtable" });
    const vh = el("tr");
    ["variant", "runs", H.label].forEach((h) => vh.append(el("th", {}, h)));
    vt.append(el("thead", {}, vh));
    const vb = el("tbody");
    slots.forEach((p) => {
      const has = p.runIndex.length > 0;
      const vr = el("tr", has ? { class: "expandable" } : {});
      const vc = el("td", has ? {} : { class: "dash" });
      if (has) vc.append(el("span", { class: "caret" }, "▸"));
      vc.append(p.v);
      vr.append(vc);
      vr.append(el("td", has ? {} : { class: "dash" },
        has ? "" + p.runIndex.length : "no runs"));
      vr.append(headlineCell(H, p.iou, "", null)); // n is rendered inline now
      vb.append(vr);
      if (!has) return;
      const vdetail = el("tr", { class: "detail hidden" });
      const vdcell = el("td", { class: "detailcell", colspan: "3" });
      vdetail.append(vdcell);
      vb.append(vdetail);
      let loaded = false;
      vr.onclick = () => {
        const open = vdetail.classList.toggle("hidden") === false;
        vr.classList.toggle("open", open);
        if (open && !loaded) {
          loaded = true;
          const cols = p.task.metrics.filter((m) => visible.has(m.group));
          renderRunDetail(vdcell, p.runIndex, cols);
        }
      };
    });
    vt.append(vb);
    tdcell.append(vt);
    tdetail.append(tdcell);
    body.append(tdetail);
    trow.onclick = () => {
      const open = tdetail.classList.toggle("hidden") === false;
      trow.classList.toggle("open", open);
    };
  });
  table.append(body);
  panel.append(el("div", { class: "scroll" }, table));
  if (!any) panel.append(el("div", { class: "note" }, "no runs logged for this model"));
}

// Coverage matrix — a secondary view now (reached from the leaderboard
// footnote), and still the automatic fallback when summary.json has no
// leaderboard payload, in which case there is nothing to go back to.
function renderOverview() {
  const ov = DATA.overview;
  const panel = $("#panel");
  panel.replaceChildren();
  if (DATA.leaderboard) {
    const back = el("a", { class: "backlink", href: "#" }, "← Leaderboard");
    back.onclick = (ev) => { ev.preventDefault(); active = "Leaderboard"; render(); };
    panel.append(back);
  }
  panel.append(el("h2", {}, "Coverage"));
  panel.append(el("div", { class: "note" },
    "Runs per model × task, and whether objective scores are graded."));

  const table = el("table");
  const head = el("tr");
  head.append(el("th", {}, "model"));
  ov.tasks.forEach((t) => head.append(el("th", {}, t)));
  table.append(el("thead", {}, head));
  const body = el("tbody");
  ov.models.forEach((m) => {
    const tr = el("tr");
    tr.append(el("td", { class: "model" }, modelLabel(m)));
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

// Lazy-load every run for one model row and render a per-run breakdown table
// (same visible metric cols) + variant col; each run row expands to its
// tool-call transcript. Visuals (video/image) are deferred — slots stay hidden.
async function renderRunDetail(container, runIndex, cols) {
  container.replaceChildren(el("div", { class: "note" }, "loading runs…"));
  let runs;
  try {
    runs = await Promise.all(runIndex.map(async (ri) => {
      const res = await fetch(`runs/${ri.run_id}.json`, { cache: "no-store" });
      if (!res.ok) throw new Error(ri.run_id);
      return res.json();
    }));
  } catch (e) {
    container.replaceChildren(el("div", { class: "note" }, "failed to load run detail"));
    return;
  }
  runs.sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || ""));

  const table = el("table", { class: "subtable" });
  const head = el("tr");
  head.append(el("th", {}, "run"));
  head.append(el("th", {}, "variant"));
  cols.forEach((m) => head.append(el("th", { title: `${m.group} · ${m.key}` }, m.label)));
  table.append(el("thead", {}, head));

  const span = 2 + cols.length;
  const tb = el("tbody");
  runs.forEach((run) => {
    const tr = el("tr", { class: "expandable" });
    tr.append(el("td", {}, el("span", { class: "caret" }, "▸"), runLabel(run)));
    tr.append(el("td", {}, run.prompt_variant || DASH));
    cols.forEach((m) => {
      const v = run.values ? run.values[m.key] : null;
      if (v == null) { tr.append(el("td", { class: "dash" }, DASH)); return; }
      tr.append(el("td", {}, fmtMain(m.fmt, v)));
    });
    tb.append(tr);

    const trow = el("tr", { class: "detail hidden" });
    const tcell = el("td", { class: "detailcell", colspan: "" + span },
      el("div", { class: "detail-h" }, "Produced CAM"),
      renderCamSummary(run),
      el("div", { class: "detail-h" }, "Tool calls"),
      renderTranscript(run));
    trow.append(tcell);
    tb.append(trow);
    tr.onclick = () => {
      const open = trow.classList.toggle("hidden") === false;
      tr.classList.toggle("open", open);
    };
  });
  table.append(tb);
  container.replaceChildren(table);
}

function runLabel(run) {
  const when = run.timestamp ? new Date(run.timestamp).toLocaleString()
                            : (run.run_id || "").slice(0, 8);
  return (run.trials_total && run.trials_total > 1)
    ? `#${(run.trial_index ?? 0) + 1} · ${when}` : when;
}

// Render the produced CAM state (build_site.cam_summary) — setups, operations,
// tools — so a reviewer sees WHAT got built, not just the metric scalars. The
// model drives Fusion via opaque execute(script) calls, so the transcript no
// longer shows the resulting CAM; this is the only structured view of it.
function renderCamSummary(run) {
  const cs = run.cam_summary;
  const wrap = el("div", { class: "camsum" });
  if (!cs) { wrap.append(el("div", { class: "note" }, "no CAM state probed")); return wrap; }
  if (cs.probe_error) { wrap.append(el("div", { class: "note bad" }, "CAM probe error")); return wrap; }
  const setups = cs.setups || [];
  if (!setups.length) { wrap.append(el("div", { class: "note" }, "no setups in probe")); return wrap; }

  setups.forEach((s) => {
    const bits = [];
    if (s.strategy) bits.push(s.strategy);
    if (Array.isArray(s.stock_size_mm))
      bits.push("stock " + s.stock_size_mm.map((x) => Math.round(x)).join("×") + "mm");
    bits.push(s.machine ? "machine: " + s.machine : "no machine");
    wrap.append(el("div", { class: "camsum-setup" },
      el("strong", {}, s.name || "Setup"),
      el("span", { class: "args" }, "  " + bits.join(" · "))));

    const ops = s.operations || [];
    if (!ops.length) { wrap.append(el("div", { class: "note" }, "no operations")); return; }
    const t = el("table", { class: "subtable camsum-ops" });
    const head = el("tr");
    ["op", "strategy", "tool", "stepover", "stepdown", "toolpath"].forEach((h) =>
      head.append(el("th", {}, h)));
    t.append(el("thead", {}, head));
    const tb = el("tbody");
    ops.forEach((op) => {
      const tool = op.tool || {};
      const toolStr = [tool.diameter ? "Ø" + tool.diameter : null, tool.type]
        .filter(Boolean).join(" ") || DASH;
      let badge;
      if (op.is_suppressed) badge = el("span", { class: "args" }, "suppressed");
      else if (op.is_toolpath_valid) badge = el("span", { class: "ok" }, "✓ valid");
      else if (op.has_toolpath) badge = el("span", { class: "bad" }, "✗ invalid");
      else badge = el("span", { class: "args" }, "no path");
      const tr = el("tr");
      tr.append(el("td", {}, op.name || DASH));
      tr.append(el("td", {}, op.strategy || DASH));
      tr.append(el("td", {}, toolStr));
      tr.append(el("td", {}, op.stepover || DASH));
      tr.append(el("td", {}, op.stepdown || DASH));
      tr.append(el("td", {}, badge));
      tb.append(tr);
    });
    t.append(tb);
    wrap.append(t);
  });
  return wrap;
}

function renderTranscript(run) {
  const wrap = el("div", { class: "transcript" });
  const p = run.provenance;
  if (p && p.mcp_git_sha) {
    const bits = [`MCP ${String(p.mcp_git_sha).slice(0, 8)}`];
    if (p.tool_count != null) bits.push(`${p.tool_count} tools`);
    if (p.vllm_version) bits.push(`vLLM ${p.vllm_version}`);
    wrap.append(el("div", { class: "note prov" }, bits.join(" · ")));
  }
  const calls = run.transcript || [];
  if (!calls.length) {
    wrap.append(el("div", { class: "note" }, "no tool calls logged"));
    return wrap;
  }
  const ol = el("ol", { class: "tcalls" });
  calls.forEach((t) => {
    const li = el("li");
    li.append(el("span", { class: t.success ? "ok" : "bad" }, t.success ? "✓" : "✗"));
    li.append(" ", el("code", {}, t.tool || "?"));
    const inp = typeof t.input === "string" ? t.input : JSON.stringify(t.input || {});
    if (inp && inp !== "{}") {
      li.append(el("span", { class: "args" }, " " + (inp.length > 90 ? inp.slice(0, 90) + "…" : inp)));
    }
    ol.append(li);
  });
  wrap.append(ol);
  return wrap;
}

function render() {
  if (active === "__model__" && DATA.leaderboard) renderModel(currentModel);
  else if (active === "Leaderboard" && DATA.leaderboard) renderLeaderboard();
  else renderOverview();
  // Metric-group toggles only drive the model page's run tables.
  $("#groups").style.display = active === "__model__" ? "flex" : "none";
  document.querySelectorAll(".tab").forEach((b) =>
    b.classList.toggle("active", b.dataset.name === active));
}

// #model=<name> deep link → the model detail page (navigated to in place from
// the leaderboard, but also directly shareable). Dropping the hash — the
// "← Leaderboard" backlink, or the browser Back button — lands back here.
function applyRoute() {
  const m = location.hash.match(/^#model=(.+)$/);
  if (m && DATA && DATA.leaderboard) {
    currentModel = decodeURIComponent(m[1]);
    active = "__model__";
  } else if (active === "__model__") {
    currentModel = null;
    active = "Leaderboard";
  }
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

// Coverage is no longer a peer tab — the leaderboard is the only top-level
// view (Coverage hangs off its footnote link), so with a single entry the strip
// is pure chrome and stays hidden. The list keeps its shape for the stale-
// summary fallback, where Coverage is the only view there is.
function buildTabs() {
  const tabs = $("#tabs");
  tabs.replaceChildren();
  const names = DATA.leaderboard ? ["Leaderboard"] : ["Coverage"];
  tabs.style.display = names.length > 1 ? "flex" : "none";
  names.forEach((name) => {
    const b = el("button", { class: "tab", "data-name": name }, name);
    b.onclick = () => {
      // Leaving a #model page: drop the hash so the route doesn't re-apply.
      if (location.hash) history.replaceState(null, "", location.pathname + location.search);
      currentModel = null;
      active = name;
      render();
    };
    tabs.append(b);
  });
}

async function init() {
  try {
    const res = await fetch("summary.json", { cache: "no-store" });
    if (!res.ok || !/json/.test(res.headers.get("content-type") ?? "")) {
      window.location.replace("/");
      return;
    }
    DATA = await res.json();
  } catch (e) {
    $("#sub").textContent = "failed to load summary.json";
    return;
  }
  if (!DATA.leaderboard) active = "Coverage"; // stale summary.json without the board
  if (DATA.n_runs != null) {
    const when = DATA.generated ? new Date(DATA.generated).toLocaleDateString() : null;
    $("#sub").textContent = `${DATA.n_runs} runs` + (when ? ` · updated ${when}` : "");
  }
  const themeBtn = $("#theme");
  if (themeBtn) {
    const syncAria = () => themeBtn.setAttribute("aria-pressed",
      document.documentElement.getAttribute("data-theme") === "dark" ? "true" : "false");
    syncAria();
    themeBtn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      syncAria();
    });
  }
  buildGroupToggles();
  buildTabs();
  applyRoute();
  // In-place navigation between the leaderboard and a model page: re-route,
  // re-render, and start at the top the way a real page load would.
  window.addEventListener("hashchange", () => {
    applyRoute();
    render();
    window.scrollTo(0, 0);
  });
  render();
}

init();
