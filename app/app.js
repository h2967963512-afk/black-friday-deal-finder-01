// FridayFinds board: search, filters, sorting and hash routing.
// One job: turn the deal list into the page, and keep every control live.

import { deals, CATEGORIES, STORES, CHECKED_LABEL, boardStats } from "./data.js";
import { renderDetail } from "./detail.js";

const VERDICTS = {
  "new-low": "New low",
  strong: "Strong deal",
  solid: "Solid deal",
  small: "Small cut",
};

const state = {
  query: "",
  category: "All",
  store: "All",
  minOff: 0,
  verdict: "All",
  sort: "discount",
};

const view = document.getElementById("view");

function money(n) {
  return "$" + n.toFixed(2).replace(/\.00$/, "");
}

function discountOf(d) {
  return Math.round((1 - d.price / d.was) * 100);
}

function savingOf(d) {
  return d.was - d.price;
}

function verdictRank(d) {
  return { "new-low": 0, strong: 1, solid: 2, small: 3 }[d.verdict];
}

function applyFilters(list) {
  const q = state.query.trim().toLowerCase();
  return list.filter((d) => {
    if (q && !(d.title + " " + d.store + " " + d.category).toLowerCase().includes(q)) return false;
    if (state.category !== "All" && d.category !== state.category) return false;
    if (state.store !== "All" && d.store !== state.store) return false;
    if (discountOf(d) < state.minOff) return false;
    if (state.verdict !== "All" && d.verdict !== state.verdict) return false;
    return true;
  });
}

function applySort(list) {
  const sorted = [...list];
  if (state.sort === "discount") sorted.sort((a, b) => discountOf(b) - discountOf(a));
  else if (state.sort === "saving") sorted.sort((a, b) => savingOf(b) - savingOf(a));
  else if (state.sort === "price-low") sorted.sort((a, b) => a.price - b.price);
  else if (state.sort === "verdict") sorted.sort((a, b) => verdictRank(a) - verdictRank(b) || discountOf(b) - discountOf(a));
  return sorted;
}

function cardHtml(d) {
  const off = discountOf(d);
  return `<article class="card">
    <div class="card-top"><span class="store">${d.store}</span><span class="category">${d.category}</span></div>
    <h3><a href="#/deal/${d.id}">${d.title}</a></h3>
    <div class="price-row">
      <span class="price">${money(d.price)}</span>
      <span class="was">${money(d.was)}</span>
      <span class="save">${off}% off · save ${money(savingOf(d))}</span>
    </div>
    <span class="badge badge-${d.verdict}">${VERDICTS[d.verdict]}</span>
    <p class="evidence">${d.evidence}</p>
    <p class="meta">Checked ${CHECKED_LABEL} · Source: ${d.source}</p>
    <div class="card-foot">
      <a class="store-link" href="${d.url}" target="_blank" rel="noopener">View at ${d.store} →</a>
      <a class="details-link" href="#/deal/${d.id}">Why this is a deal</a>
    </div>
  </article>`;
}

function topDeals() {
  return [...deals]
    .sort((a, b) => verdictRank(a) - verdictRank(b) || savingOf(b) - savingOf(a))
    .slice(0, 5);
}

function renderBoard() {
  const stats = boardStats(deals);
  const filtered = applySort(applyFilters(deals));
  const top = topDeals();

  const categoryChips = ["All", ...CATEGORIES]
    .map(
      (c) =>
        `<button class="chip" data-category="${c}" aria-pressed="${state.category === c}">${c}</button>`
    )
    .join("");

  const storeOptions = ["All", ...STORES]
    .map((s) => `<option value="${s}"${state.store === s ? " selected" : ""}>${s === "All" ? "All stores" : s}</option>`)
    .join("");

  const verdictOptions = ["All", "new-low", "strong", "solid", "small"]
    .map(
      (v) =>
        `<option value="${v}"${state.verdict === v ? " selected" : ""}>${v === "All" ? "Any verdict" : VERDICTS[v] + " only"}</option>`
    )
    .join("");

  const discountOptions = [0, 25, 40, 50, 60]
    .map(
      (n) =>
        `<option value="${n}"${state.minOff === n ? " selected" : ""}>${n === 0 ? "Any discount" : n + "% off or more"}</option>`
    )
    .join("");

  const sortOptions = [
    ["discount", "Biggest % off first"],
    ["saving", "Biggest saving ($) first"],
    ["verdict", "Best verdict first"],
    ["price-low", "Lowest price first"],
  ]
    .map(([v, label]) => `<option value="${v}"${state.sort === v ? " selected" : ""}>${label}</option>`)
    .join("");

  view.innerHTML = `
    <section class="stats" aria-label="Board summary">
      <div class="stat"><b>${stats.count}</b><span>verified deals</span></div>
      <div class="stat"><b>${money(stats.totalSaving)}</b><span>total savings vs usual prices</span></div>
      <div class="stat"><b>${stats.avgDiscount}%</b><span>average discount</span></div>
      <div class="stat"><b>${stats.newLows}</b><span>at their lowest price ever</span></div>
    </section>

    <section class="controls" aria-label="Find a deal">
      <div class="search-row">
        <input type="search" id="q" placeholder="Search deals — try “AirPods”, “TV” or “vacuum”…" value="${state.query.replace(/"/g, "&quot;")}" aria-label="Search deals">
        <select id="store" aria-label="Filter by store">${storeOptions}</select>
        <select id="minoff" aria-label="Filter by discount">${discountOptions}</select>
        <select id="verdict" aria-label="Filter by verdict">${verdictOptions}</select>
        <select id="sort" aria-label="Sort deals">${sortOptions}</select>
      </div>
      <div class="chips" role="group" aria-label="Filter by category">${categoryChips}</div>
      <p class="result-line">Showing <b>${filtered.length}</b> of ${deals.length} deals · checked ${CHECKED_LABEL}</p>
    </section>

    <section class="top-strip" id="top">
      <h2>Top 5 deals right now</h2>
      <p>Ranked by verdict first, then by dollars saved.</p>
      <div class="top-list">
        ${top
          .map(
            (d, i) => `<a class="top-item" href="#/deal/${d.id}">
              <span class="rank">#${i + 1} · ${VERDICTS[d.verdict]}</span>
              <span class="name">${d.title}</span>
              <span class="price">${money(d.price)}</span><span class="was">${money(d.was)}</span>
              <span class="off">${discountOf(d)}% off at ${d.store} — save ${money(savingOf(d))}</span>
            </a>`
          )
          .join("")}
      </div>
    </section>

    ${
      filtered.length
        ? `<section class="grid" aria-label="Deals">${filtered.map(cardHtml).join("")}</section>`
        : `<div class="empty"><p><strong>No deals match.</strong> Try a different search or clear a filter — every deal on this board is real, so an empty result means the filter is too narrow, not that the board is empty.</p><button id="clear">Clear all filters</button></div>`
    }`;

  document.getElementById("q").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderBoardKeepFocus();
  });
  document.getElementById("store").addEventListener("change", (e) => {
    state.store = e.target.value;
    renderBoard();
  });
  document.getElementById("minoff").addEventListener("change", (e) => {
    state.minOff = Number(e.target.value);
    renderBoard();
  });
  document.getElementById("verdict").addEventListener("change", (e) => {
    state.verdict = e.target.value;
    renderBoard();
  });
  document.getElementById("sort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderBoard();
  });
  view.querySelectorAll(".chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      state.category = chip.dataset.category;
      renderBoard();
    })
  );
  const clear = document.getElementById("clear");
  if (clear) {
    clear.addEventListener("click", () => {
      state.query = "";
      state.category = "All";
      state.store = "All";
      state.minOff = 0;
      state.verdict = "All";
      renderBoard();
    });
  }
}

// Re-render while typing, without stealing the search box's focus.
function renderBoardKeepFocus() {
  const pos = document.getElementById("q").selectionStart;
  renderBoard();
  const q = document.getElementById("q");
  q.focus();
  q.setSelectionRange(pos, pos);
}

function route() {
  const hash = location.hash || "#/";
  const match = hash.match(/^#\/deal\/([\w-]+)$/);
  if (match) {
    const deal = deals.find((d) => d.id === match[1]);
    if (deal) {
      renderDetail(deal, { money, discountOf, savingOf, VERDICTS });
      return;
    }
  }
  renderBoard();
  if (hash === "#/top") {
    document.getElementById("top")?.scrollIntoView();
  }
}

window.addEventListener("hashchange", route);
route();
