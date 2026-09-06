/* ============================================================
   SENTRY · utils.js  — small helpers used everywhere
   ============================================================ */
(function (w) {
  "use strict";
  var CFG = w.SENTRY_CONFIG;

  /* Some embedded browsers ship without rAF; fall back to a timeout so
     the animated bars still reach their final width. */
  var raf = w.requestAnimationFrame ? w.requestAnimationFrame.bind(w)
          : function (fn) { return setTimeout(fn, 16); };

  /* ---------- DOM ---------- */
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === "class") n.className = v;
        else if (k === "html") n.innerHTML = v;
        else if (k === "text") n.textContent = v;
        else if (k.slice(0, 2) === "on" && typeof v === "function") n.addEventListener(k.slice(2), v);
        else if (k === "dataset") { for (var d in v) n.dataset[d] = v[d]; }
        else n.setAttribute(k, v === true ? "" : v);
      }
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }
  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* Escape untrusted text before it goes into an innerHTML template. */
  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---------- numbers & dates ---------- */
  function num(v, dp) {
    if (v === null || v === undefined || isNaN(v)) return "—";
    return Number(v).toLocaleString("en-GB", {
      minimumFractionDigits: dp === undefined ? 0 : dp,
      maximumFractionDigits: dp === undefined ? 0 : dp
    });
  }
  function kg(v) {
    if (v === null || v === undefined || isNaN(v)) return "—";
    return v >= 1000 ? num(v / 1000, 1) + " t" : num(v, 0) + " kg";
  }
  function money(v) {
    var E = CFG.ECONOMICS;
    if (v === null || v === undefined || isNaN(v)) return "—";
    return E.symbol + num(Math.round(v), 0);
  }
  function pct(v, dp) { return v === null || v === undefined || isNaN(v) ? "—" : num(v, dp === undefined ? 1 : dp) + "%"; }

  function clock(d) {
    d = d ? new Date(d) : new Date();
    return d.toTimeString().slice(0, 8);
  }
  function stamp(d) {
    d = d ? new Date(d) : new Date();
    var p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
           " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }
  function dateOnly(d) {
    d = new Date(d);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  function daysBetween(a, b) {
    return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
  }
  function ago(d) {
    var s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }

  /* ---------- status logic (single source of truth) ---------- */
  /* Returns "ok" | "warn" | "alert" for a reading against its cap. */
  function levelFor(value, cap, warnAt) {
    if (value === null || value === undefined || isNaN(value)) return "ok";
    if (value >= cap) return "alert";
    if (value >= (warnAt !== undefined ? warnAt : cap * 0.93)) return "warn";
    return "ok";
  }
  var LEVEL_WORD = { ok: "Within range", warn: "Approaching cap", alert: "Above cap" };
  var LEVEL_RANK = { ok: 0, warn: 1, alert: 2 };
  function worstLevel(list) {
    return list.reduce(function (a, b) { return LEVEL_RANK[b] > LEVEL_RANK[a] ? b : a; }, "ok");
  }

  /* Spoilage risk 0..100 from temperature, humidity and grain moisture.
     Deliberately simple and explainable — a store manager should be able
     to see why the number moved. Replace with the backend value when the
     TinyML model is wired in (GET /metrics/summary -> riskIndex). */
  function riskIndex(t, h, m) {
    var T = CFG.THRESHOLDS;
    var a = Math.max(0, (t - 22) / (T.tempMax - 22)) * 42;
    var b = Math.max(0, (h - 50) / (T.humidityMax - 50)) * 38;
    var c = Math.max(0, (m - 11) / (T.moistureMax - 11)) * 20;
    return Math.max(0, Math.min(100, Math.round(a + b + c)));
  }
  function riskLabel(r) {
    if (r >= 75) return { word: "Critical", level: "alert" };
    if (r >= 50) return { word: "Elevated", level: "warn" };
    if (r >= 28) return { word: "Watch",    level: "warn" };
    return { word: "Stable", level: "ok" };
  }
  /* Days of safe storage left before risk crosses critical, given trend. */
  function safeDays(risk, trendPerDay) {
    if (trendPerDay <= 0.1) return 90;
    return Math.max(0, Math.round((78 - risk) / trendPerDay));
  }

  /* ---------- misc ---------- */
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function round(v, dp) { var f = Math.pow(10, dp || 0); return Math.round(v * f) / f; }
  function uid(p) { return (p || "id") + "_" + Math.random().toString(36).slice(2, 9); }
  function debounce(fn, ms) {
    var t; return function () {
      var a = arguments, c = this;
      clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 200);
    };
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var store = {
    get: function (k, dflt) {
      try { var v = localStorage.getItem("sentry." + k); return v === null ? dflt : JSON.parse(v); }
      catch (e) { return dflt; }
    },
    set: function (k, v) {
      try { localStorage.setItem("sentry." + k, JSON.stringify(v)); } catch (e) { }
    },
    del: function (k) { try { localStorage.removeItem("sentry." + k); } catch (e) { } }
  };

  /* Download an array of objects as a real CSV file. */
  function downloadCSV(filename, rows, columns) {
    if (!rows || !rows.length) return false;
    var cols = columns || Object.keys(rows[0]);
    var q = function (v) {
      v = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    var csv = cols.map(q).join(",") + "\n" +
      rows.map(function (r) { return cols.map(function (c) { return q(r[c]); }).join(","); }).join("\n");
    var blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = el("a", { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    return true;
  }

  /* Swap in a woven-texture placeholder if a photo fails to load,
     so a dead CDN never leaves a broken-image icon on screen. */
  var FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#0B5A2B"/><stop offset="1" stop-color="#063B1B"/></linearGradient></defs>' +
    '<rect width="800" height="600" fill="url(#g)"/>' +
    '<g stroke="#E0A82E" stroke-width="2" opacity=".28" fill="none">' +
    '<path d="M400 200v220M400 250c60-40 100-20 100-20s-40 60-100 60zm0 90c-60-40-100-20-100-20s40 60 100 60z"/></g>' +
    '<text x="400" y="500" font-family="monospace" font-size="22" fill="#E0A82E" text-anchor="middle" letter-spacing="6">SENTRY</text></svg>');

  function img(src, alt, cls) {
    var n = el("img", { src: src, alt: alt || "", class: cls || "", loading: "lazy", decoding: "async" });
    n.addEventListener("error", function () {
      if (n.dataset.fellback) return;
      n.dataset.fellback = "1"; n.src = FALLBACK;
    });
    return n;
  }

  w.U = {
    el: el, $: $, $$: $$, esc: esc, img: img, FALLBACK: FALLBACK,
    num: num, kg: kg, money: money, pct: pct,
    clock: clock, stamp: stamp, dateOnly: dateOnly, daysBetween: daysBetween, ago: ago,
    levelFor: levelFor, LEVEL_WORD: LEVEL_WORD, worstLevel: worstLevel,
    riskIndex: riskIndex, riskLabel: riskLabel, safeDays: safeDays,
    clamp: clamp, round: round, uid: uid, debounce: debounce, sleep: sleep,
    store: store, downloadCSV: downloadCSV, raf: raf
  };
})(window);
