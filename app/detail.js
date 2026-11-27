// FridayFinds deal detail: one page per deal, with the evidence behind the
// verdict and the same product's price at other stores, so a shopper can
// compare before clicking out.

import { CHECKED_LABEL } from "./data.js";

export function renderDetail(d, helpers) {
  const { money, discountOf, savingOf, VERDICTS } = helpers;
  const off = discountOf(d);
  const view = document.getElementById("view");

  const compareRows =
    d.alsoAt.length > 0
      ? `<h2>Same product, other stores</h2>
      <table class="compare">
        <thead><tr><th>Store</th><th>Price</th><th>Against this deal</th></tr></thead>
        <tbody>
          <tr><td><strong>${d.store} (this deal)</strong></td><td><strong>${money(d.price)}</strong></td><td class="best">Best price found</td></tr>
          ${d.alsoAt
            .map(
              (o) =>
                `<tr><td>${o.store}</td><td>${money(o.price)}</td><td>${o.price > d.price ? "+" + money(o.price - d.price) + " more" : o.price === d.price ? "Same price" : money(d.price - o.price) + " less"}${
                  o.label ? ` · ${o.label}` : ""
                }</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
      <p class="meta">Other-store prices are from the same round of checks, Nov 27, 2026. They move too — confirm at the store.</p>`
      : `<h2>Same product, other stores</h2>
      <p>No other store was found selling this exact item cheaper, or at a checked price, in this round. That is part of why it made the board.</p>`;

  view.innerHTML = `
    <section class="detail">
      <a class="back" href="#/">← Back to all deals</a>
      <article class="detail-card">
        <span class="store">${d.store} · ${d.category}</span>
        <h1>${d.title}</h1>
        <p class="detail-sub">${d.note}</p>
        <div class="detail-prices">
          <span class="price">${money(d.price)}</span>
          <span class="was">${money(d.was)}</span>
          <span class="save">${off}% off · save ${money(savingOf(d))}</span>
          <span class="badge badge-${d.verdict}">${VERDICTS[d.verdict]}</span>
        </div>
        <h2>Why this is a deal</h2>
        <p>${d.evidence}</p>
        <h2>How the price was checked</h2>
        <p>Checked <strong>${CHECKED_LABEL}</strong>. Source: <strong>${d.source}</strong>. The sale price and the usual price are the store's own figures; the discount is computed from them, so the math adds up: ${money(d.was)} − ${money(d.price)} = ${money(savingOf(d))} saved, ${off}% off.</p>
        ${compareRows}
        <div class="detail-actions">
          <a class="store-link" href="${d.url}" target="_blank" rel="noopener">View at ${d.store} →</a>
          <span class="meta">Opens the store's product page in a new tab. Prices can move — confirm at checkout.</span>
        </div>
      </article>
    </section>`;
  window.scrollTo(0, 0);
}
