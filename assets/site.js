// Shared by every page: header, footer, theme switch, and the drop-history maths.
(function () {
  const PAGES = [["index.html", "Home"], ["setup.html", "Setup"], ["aco.html", "ACO"], ["drops.html", "Drop history"], ["cards.html", "Card hit rates"]];
  // the host serves /cards as well as /cards.html, so compare page names without the extension
  const bare = s => (s || "").replace(/\.html$/, "") || "index";
  const here = bare(location.pathname.split("/").pop());

  function el(tag, attrs, kids) {
    const n = document.createElement(tag);
    for (const k in (attrs || {})) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(c => n.append(c));
    return n;
  }
  window.el = el;

  // theme: follow the device unless the visitor picked one
  function setTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme");
  }
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  setTheme(saved === "light" ? "light" : "dark");          // dark is the default; light only if they chose it

  function header() {
    const nav = el("nav", { class: "nav", "aria-label": "Main" }, PAGES.map(([href, name]) => {
      const a = el("a", { href: href, text: name });
      if (bare(href) === here) a.setAttribute("aria-current", "page");
      // fetch the page as soon as the pointer is on its link, so the switch feels instant
      a.addEventListener("pointerenter", () => { if (!a._pre && bare(href) !== here) { a._pre = 1; document.head.append(el("link", { rel: "prefetch", href: href })); } }, { once: true });
      return a;
    }));
    const btn = el("button", { class: "theme-btn", type: "button", "aria-label": "Switch between light and dark" }, [el("span", { class: "knob", "aria-hidden": "true" })]);
    btn.addEventListener("click", () => {
      const dark = getComputedStyle(document.documentElement).colorScheme.includes("dark");
      const next = dark ? "light" : "dark";
      setTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
    const brand = el("a", { class: "brand", href: "index.html" });
    brand.append("https", el("span", { text: "murphy" }));
    return el("header", { class: "site-head" }, [el("div", { class: "wrap" }, [brand, nav, btn])]);
  }

  function footer() {
    const left = el("span");
    left.append("Links to bots, groups, servers and cards on this site are referral links. ");
    const kids = [left], extra = document.getElementById("foot-right");   // a page can add its own note on the right (drop history: the data credit)
    if (extra) { const right = el("span", { class: "foot-right" }); right.append(extra.content.cloneNode(true)); kids.push(right); }
    return el("footer", { class: "site-foot" }, [el("div", { class: "wrap" }, kids)]);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.body.prepend(header());
    document.body.append(footer());
    // The host serves /setup and redirects /setup.html to it. Linking straight to the short address saves that hop on
    // every page change, which is what made moving between pages feel slow on a phone. (Local preview keeps .html.)
    if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) document.querySelectorAll('a[href]').forEach(a => {
      const h = a.getAttribute("href"); if (/^[a-z0-9-]+\.html(#.*)?$/i.test(h)) a.setAttribute("href", h === "index.html" ? "./" : h.replace(".html", ""));
    });
  });

  // ---------- drop history ----------
  function parseDrops(raw) {
    if (raw === undefined) raw = window.DROPS_RAW;
    if (!raw) return [];
    return raw.trim().split("\n").map(line => {
      const [date, queue, pre, items] = line.split("|");
      return {
        date: date, queue: queue, pre: pre === "P", count: Number(pre) || 0,
        items: (items || "").split(";").filter(Boolean).map(s => { const [name, set, live, oos] = s.split("~"); return { name: name, set: set, live: live, oos: oos }; }),
      };
    });
  }
  const DAY = 86400000;
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const utc = s => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  const mins = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const hhmm = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(Math.round(m % 60)).padStart(2, "0");

  function stats(drops) {
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const recent = drops.slice(0, 40);                       // newest first
    const gaps = [];
    for (let i = 0; i < recent.length - 1; i++) gaps.push((utc(recent[i].date) - utc(recent[i + 1].date)) / DAY);
    const avgGap = gaps.reduce((a, b) => a + b, 0) / (gaps.length || 1);
    const byDay = [0, 0, 0, 0, 0, 0, 0];
    recent.forEach(d => byDay[new Date(utc(d.date)).getUTCDay()]++);
    const topDay = byDay.indexOf(Math.max.apply(null, byDay));
    const times = recent.map(d => mins(d.queue)).sort((a, b) => a - b);
    const q = p => times[Math.min(times.length - 1, Math.floor(p * times.length))];
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
      const key = d.toISOString().slice(0, 7);
      months.push({ label: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }), n: drops.filter(x => x.date.slice(0, 7) === key).length });
    }
    // weekday (Mon–Fri) × hour (14–22) grid of when the queue opened
    const grid = {};
    recent.forEach(d => { const k = new Date(utc(d.date)).getUTCDay() + "-" + Math.floor(mins(d.queue) / 60); grid[k] = (grid[k] || 0) + 1; });
    return {
      since: Math.max(0, Math.round((today - utc(drops[0].date)) / DAY)),
      avgGap: avgGap, minGap: Math.min.apply(null, gaps), maxGap: Math.max.apply(null, gaps),
      topDay: DAYS[topDay], topDayN: byDay[topDay], sample: recent.length,
      window: hhmm(q(.15)) + "–" + hhmm(q(.85)), last: drops[0], months: months, grid: grid,
    };
  }

  function niceDate(s) { return new Date(utc(s)).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }); }
  function itemName(n) { return /^\d{2}-\d+-\d+$/.test(n) ? "Unnamed product · SKU " + n : n; }

  window.Drops = { all: parseDrops, parse: parseDrops, stats: stats, niceDate: niceDate, itemName: itemName, DAYS: DAYS };
})();
