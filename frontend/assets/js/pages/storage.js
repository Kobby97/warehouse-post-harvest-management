/* ============================================================
   SENTRY · pages/storage.js
   Bays, grain lots, and the loss ledger.
   ============================================================ */
(function (w) {
  "use strict";
  var U = w.U, UI = w.UI, ICON = w.ICON, STORE = w.STORE, API = w.API, CFG = w.SENTRY_CONFIG;

  var STATUS_CHIP = { storing: "ok", "at-risk": "warn", dispatched: "mute", quarantine: "alert" };
  var STATUS_WORD = { storing: "Storing", "at-risk": "At risk", dispatched: "Dispatched", quarantine: "Quarantined" };

  function render(mount) {
    var offs = [];
    document.body.dataset.heroDark = "1";
    mount.innerHTML = "";

    var view = { q: "", status: "active", sort: "intakeDate", dir: -1 };

    mount.appendChild(UI.pageHero({
      eyebrow: "Storage",
      title: "What is in the store, and how long it has been there",
      lede: "Every intake is a lot. Sentry follows each one from the weighbridge to dispatch, and tells you which should leave first.",
      chips: [CFG.FACILITY.name, "6 bays", "Live weight from HX711"]
    }));

    /* ---------------- summary tiles ---------------- */
    var tiles = U.el("div", { class: "grid grid--4" });
    mount.appendChild(U.el("section", { class: "section section--tight" }, [
      U.el("div", { class: "wrap" }, [tiles])
    ]));

    function paintTiles() {
      var b = STORE.state.batches.filter(function (x) { return x.status !== "dispatched"; });
      var stored = b.reduce(function (n, x) { return n + x.weightKg; }, 0);
      var lost = b.reduce(function (n, x) { return n + x.weightKg * x.lossPct / 100; }, 0);
      var oldest = b.reduce(function (a, x) {
        return (!a || new Date(x.intakeDate) < new Date(a.intakeDate)) ? x : a;
      }, null);
      tiles.innerHTML = "";
      [
        UI.metricTile({ label: "Grain in store", value: U.kg(stored), icon: "scale", foot: b.length + " active lots" }),
        UI.metricTile({ label: "Lost to date", value: U.kg(Math.round(lost)), icon: "trend", tone: "warn",
          foot: U.pct(stored ? lost / stored * 100 : 0) + " of intake weight" }),
        UI.metricTile({ label: "Value at risk", value: U.money(lost * CFG.ECONOMICS.pricePerKg), icon: "bug", tone: "alert",
          foot: "At " + CFG.ECONOMICS.symbol + CFG.ECONOMICS.pricePerKg.toFixed(2) + "/kg" }),
        UI.metricTile({ label: "Longest in store", value: oldest ? U.daysBetween(oldest.intakeDate, Date.now()) : 0, unit: "days",
          icon: "clock", foot: oldest ? oldest.id + " · " + oldest.crop : "—" })
      ].forEach(function (n) { tiles.appendChild(n); });
    }

    /* ---------------- bays ---------------- */
    var bayGrid = U.el("div", { class: "grid grid--3" });
    mount.appendChild(U.el("section", { class: "section section--paper" }, [
      U.el("div", { class: "wrap" }, [
        U.el("div", { class: "section__head section__head--split" }, [
          U.el("div", {}, [
            U.el("p", { class: "eyebrow", text: "Bays" }),
            U.el("h2", { text: "Six storage bays" }),
            U.el("p", { text: "Each bay carries its own ESP32 gateway. Tap a bay to see the lots inside it." })
          ])
        ]),
        bayGrid
      ])
    ]));

    function paintBays() {
      var T = STORE.state.thresholds;
      bayGrid.innerHTML = "";
      if (!STORE.state.silos.length) {
        for (var i = 0; i < 3; i++) bayGrid.appendChild(U.el("div", { class: "skel skel--card" }));
        return;
      }
      STORE.state.silos.forEach(function (s) {
        var empty = s.weightKg === 0;
        var lvl = empty ? "mute" : U.worstLevel([
          U.levelFor(s.temperature, T.tempMax, T.tempMax - 2),
          U.levelFor(s.humidity, T.humidityMax, T.humidityMax - 5)
        ]);
        var chipClass = empty ? "chip--mute" : lvl === "ok" ? "chip--ok" : "chip--" + lvl;
        var lots = STORE.state.batches.filter(function (b) { return b.silo === s.id && b.status !== "dispatched"; });
        var fillPct = Math.round(s.weightKg / s.capacityKg * 100);

        bayGrid.appendChild(U.el("article", { class: "batch" }, [
          U.el("div", { class: "batch__media" }, [
            U.img(s.image, s.name, ""),
            U.el("span", { class: "chip " + chipClass + " batch__badge" },
              [U.el("i", { class: "dot" }), document.createTextNode(empty ? "Empty" : U.LEVEL_WORD[lvl])]),
            U.el("span", { class: "batch__cap", text: s.gateway + " · seen " + U.ago(s.lastSeen) })
          ]),
          U.el("div", { class: "batch__body" }, [
            U.el("div", {}, [
              U.el("div", { class: "batch__name", text: s.name }),
              U.el("div", { class: "batch__sub", text: s.crop + " · " + lots.length + " lot" + (lots.length === 1 ? "" : "s") })
            ]),
            UI.meter("Capacity", fillPct, 100, fillPct > 90 ? "gold" : null),
            U.el("div", { class: "batch__stats" }, [
              U.el("div", { class: "batch__stat" }, [U.el("b", { text: empty ? "—" : s.temperature + "°" }), U.el("span", { text: "Temp" })]),
              U.el("div", { class: "batch__stat" }, [U.el("b", { text: empty ? "—" : s.humidity + "%" }), U.el("span", { text: "Humidity" })]),
              U.el("div", { class: "batch__stat" }, [U.el("b", { text: U.kg(s.weightKg) }), U.el("span", { text: "Weight" })])
            ]),
            U.el("div", { class: "batch__acts" }, [
              U.el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Inspect bay",
                onclick: function () { openBay(s, lots); } }),
              empty ? null : U.el("button", { class: "btn btn--sm", type: "button", text: "Filter lots",
                onclick: function () {
                  view.q = s.id; searchInput.value = s.id; paintTable();
                  document.getElementById("lotLedger").scrollIntoView({ behavior: "smooth", block: "start" });
                } })
            ])
          ])
        ]));
      });
    }

    function openBay(s, lots) {
      var T = STORE.state.thresholds;
      var gaugeMount = U.el("div", { class: "silogauge" });
      var body = U.el("div", {}, [
        gaugeMount,
        U.el("div", { class: "silofacts", style: "margin-top:16px" }, [
          fact("Crop", s.crop), fact("Gateway", s.gateway),
          fact("Grain moisture", s.moisture ? s.moisture + "%" : "—"),
          fact("Respiration CO₂", s.co2 + " ppm"),
          fact("Weight", U.kg(s.weightKg) + " of " + U.kg(s.capacityKg))
        ]),
        U.el("h3", { style: "font-size:16px;margin:22px 0 10px", text: "Lots in this bay" }),
        lots.length
          ? U.el("div", {}, lots.map(function (b) {
              return U.el("div", { class: "feed__row" }, [
                U.el("span", { class: "feed__time", text: b.id }),
                U.el("span", { class: "feed__icon feed__icon--" + (b.status === "at-risk" ? "warn" : "ok"), html: ICON(b.status === "at-risk" ? "warn" : "check", 16) }),
                U.el("span", { class: "feed__text", text: b.crop + " · " + U.kg(b.weightKg) + " · " + b.farmer }),
                U.el("span", { class: "feed__tag", text: U.daysBetween(b.intakeDate, Date.now()) + "d" })
              ]);
            }))
          : U.el("p", { class: "err", text: "This bay is empty." })
      ]);
      UI.openModal({ title: s.name, body: body, actions: [{ label: "Close", kind: "ghost" }] });
      w.CHART.siloGauge(gaugeMount, s, T);
    }
    function fact(k, v) {
      return U.el("div", { class: "silofact" }, [
        U.el("span", { class: "silofact__k", text: k }),
        U.el("span", {}), U.el("span", { class: "silofact__v", text: v })
      ]);
    }

    /* ---------------- lot ledger ---------------- */
    var searchInput = U.el("input", { class: "input", type: "search", placeholder: "Search lot, crop, farmer or bay…", "aria-label": "Search lots" });
    searchInput.addEventListener("input", U.debounce(function () { view.q = searchInput.value.trim(); paintTable(); }, 160));

    var chips = U.el("div", { class: "filterchips" });
    [
      { v: "active", l: "In store" }, { v: "at-risk", l: "At risk" },
      { v: "dispatched", l: "Dispatched" }, { v: "all", l: "All" }
    ].forEach(function (o) {
      chips.appendChild(U.el("button", {
        class: "filterchip", type: "button", text: o.l, "aria-pressed": String(view.status === o.v),
        onclick: function () {
          view.status = o.v;
          U.$$(".filterchip", chips).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          this.setAttribute("aria-pressed", "true");
          paintTable();
        }
      }));
    });

    var tbody = U.el("tbody");
    var COLS = [
      { k: "id", l: "Lot" }, { k: "crop", l: "Crop" }, { k: "silo", l: "Bay" },
      { k: "farmer", l: "Supplier" }, { k: "intakeDate", l: "Intake" },
      { k: "days", l: "Days" }, { k: "weightKg", l: "Weight" },
      { k: "moisture", l: "Moisture" }, { k: "lossPct", l: "Loss" },
      { k: "value", l: "Value at risk" }, { k: "status", l: "Status" }, { k: "act", l: "" }
    ];
    var thead = U.el("thead", {}, [U.el("tr", {}, COLS.map(function (c) {
      if (c.k === "act") return U.el("th", { text: "" });
      var th = U.el("th", { "data-sort": c.k, html: U.esc(c.l) + '<span class="arrow">↕</span>', tabindex: "0", role: "columnheader" });
      var doSort = function () {
        view.dir = view.sort === c.k ? -view.dir : (c.k === "id" || c.k === "crop" || c.k === "farmer" ? 1 : -1);
        view.sort = c.k; paintTable();
      };
      th.addEventListener("click", doSort);
      th.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doSort(); } });
      return th;
    }))]);

    var exportBtn = U.el("button", { class: "btn btn--ghost btn--sm", type: "button",
      html: ICON("download", 16) + "<span>Export CSV</span>", onclick: exportCSV });
    var addBtn = U.el("button", { class: "btn btn--sm", type: "button",
      html: ICON("plus", 16) + "<span>Book in a lot</span>", onclick: openIntake });

    mount.appendChild(U.el("section", { class: "section section--husk2", id: "lotLedger" }, [
      U.el("div", { class: "wrap" }, [
        U.el("div", { class: "section__head section__head--split" }, [
          U.el("div", {}, [
            U.el("p", { class: "eyebrow", text: "Loss ledger" }),
            U.el("h2", { text: "Every lot in the building" }),
            U.el("p", { text: "Sorted by what you care about. Loss is calculated against the weight booked in at intake." })
          ]),
          U.el("div", { style: "display:flex;gap:10px;flex-wrap:wrap" }, [exportBtn, addBtn])
        ]),
        U.el("div", { class: "toolbar" }, [
          U.el("div", { class: "search" }, [
            U.el("span", { html: ICON("search", 18) }), searchInput
          ]),
          chips
        ]),
        U.el("div", { class: "tablewrap" }, [U.el("table", { class: "tbl" }, [thead, tbody])])
      ])
    ]));

    function rows() {
      var q = view.q.toLowerCase();
      var list = STORE.state.batches.filter(function (b) {
        if (view.status === "active" && b.status === "dispatched") return false;
        if (view.status === "at-risk" && b.status !== "at-risk") return false;
        if (view.status === "dispatched" && b.status !== "dispatched") return false;
        if (!q) return true;
        return [b.id, b.crop, b.variety, b.silo, b.farmer, b.status].join(" ").toLowerCase().indexOf(q) !== -1;
      }).map(function (b) {
        var days = U.daysBetween(b.intakeDate, Date.now());
        var lossKg = b.weightKg * b.lossPct / 100;
        return Object.assign({}, b, { days: days, lossKg: lossKg, value: lossKg * CFG.ECONOMICS.pricePerKg });
      });
      var k = view.sort;
      list.sort(function (a, b) {
        var x = a[k], y = b[k];
        if (k === "intakeDate") { x = new Date(x); y = new Date(y); }
        if (typeof x === "string") return x.localeCompare(y) * view.dir;
        return (x - y) * view.dir;
      });
      return list;
    }

    function paintTable() {
      U.$$("th[data-sort]", thead).forEach(function (th) {
        if (th.dataset.sort === view.sort) th.setAttribute("aria-sort", view.dir > 0 ? "ascending" : "descending");
        else th.removeAttribute("aria-sort");
        var a = th.querySelector(".arrow");
        if (a) a.textContent = th.dataset.sort === view.sort ? (view.dir > 0 ? "↑" : "↓") : "↕";
      });

      var list = rows();
      tbody.innerHTML = "";
      if (!list.length) {
        tbody.appendChild(U.el("tr", {}, [U.el("td", { colspan: COLS.length }, [
          UI.emptyState("No lots match that filter. Clear the search to see everything in store.", "Clear filters", function () {
            view.q = ""; view.status = "all"; searchInput.value = "";
            U.$$(".filterchip", chips).forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === 3)); });
            paintTable();
          })
        ])]));
        return;
      }
      list.forEach(function (b) {
        var T = STORE.state.thresholds;
        var wet = b.moisture > T.moistureMax;
        tbody.appendChild(U.el("tr", { class: b.status === "at-risk" ? "is-breach" : "" }, [
          U.el("td", {}, [U.el("span", { class: "num strong", text: b.id })]),
          U.el("td", { text: b.crop + (b.variety ? " · " + b.variety : "") }),
          U.el("td", {}, [U.el("span", { class: "num", text: b.silo })]),
          U.el("td", { text: b.farmer }),
          U.el("td", {}, [U.el("span", { class: "num", text: U.dateOnly(b.intakeDate) })]),
          U.el("td", {}, [U.el("span", { class: "num", text: b.days })]),
          U.el("td", {}, [U.el("span", { class: "num", text: U.kg(b.weightKg) })]),
          U.el("td", {}, [U.el("span", { class: "num" + (wet ? " breachval" : ""), text: b.moisture ? b.moisture.toFixed(1) + "%" : "—" })]),
          U.el("td", {}, [U.el("span", { class: "num" + (b.lossPct >= 3 ? " breachval" : ""), text: b.lossPct.toFixed(1) + "%" })]),
          U.el("td", {}, [U.el("span", { class: "num", text: U.money(b.value) })]),
          U.el("td", {}, [U.el("span", { class: "chip chip--" + (STATUS_CHIP[b.status] || "mute"), text: STATUS_WORD[b.status] || b.status })]),
          U.el("td", {}, [
            b.status === "dispatched"
              ? U.el("span", { class: "feed__tag", text: "closed" })
              : U.el("button", { class: "btn btn--ghost btn--xs", type: "button", text: "Dispatch",
                  onclick: function () { dispatch(b); } })
          ])
        ]));
      });
    }

    function dispatch(b) {
      UI.confirmAction({
        title: "Dispatch " + b.id + "?",
        message: "This closes the lot at " + U.kg(b.weightKg) + " and removes it from the live weight for " + b.silo + ". The record stays in the ledger.",
        confirmLabel: "Dispatch lot", kind: ""
      }).then(function (ok) {
        if (!ok) return;
        API.dispatchBatch(b.id).then(function () {
          STORE.state.batches = STORE.state.batches.map(function (x) {
            return x.id === b.id ? Object.assign({}, x, { status: "dispatched" }) : x;
          });
          STORE.log("info", b.id + " dispatched — " + U.kg(b.weightKg) + " of " + b.crop, "Intake desk");
          STORE.emit("batches", STORE.state.batches);
          UI.toast("Lot dispatched", b.id + " is closed and out of the loss calculation.", "ok");
        });
      });
    }

    function openIntake() {
      var siloOpts = STORE.state.silos.map(function (s) {
        return U.el("option", { value: s.id, text: s.id + " — " + s.crop });
      });
      var body = U.el("div", {}, [
        U.el("p", { text: "Book in what arrived at the weighbridge. Sentry will start tracking it from this moment." }),
        U.el("div", { class: "grid grid--2", style: "gap:14px" }, [
          field("bCrop", "Crop", U.el("select", { class: "select", id: "bCrop" },
            ["Maize", "Cowpea", "Rice", "Groundnut", "Sorghum", "Soya"].map(function (c) { return U.el("option", { value: c, text: c }); }))),
          field("bVariety", "Variety", U.el("input", { class: "input", id: "bVariety", placeholder: "Obatanpa" }))
        ]),
        U.el("div", { class: "grid grid--2", style: "gap:14px" }, [
          field("bSilo", "Bay", U.el("select", { class: "select", id: "bSilo" }, siloOpts)),
          field("bFarmer", "Supplier", U.el("input", { class: "input", id: "bFarmer", placeholder: "Name or co-op" }))
        ]),
        U.el("div", { class: "grid grid--2", style: "gap:14px" }, [
          field("bWeight", "Weight (kg)", U.el("input", { class: "input", id: "bWeight", type: "number", min: "1", step: "1", placeholder: "3200" })),
          field("bMoisture", "Moisture at intake (%)", U.el("input", { class: "input", id: "bMoisture", type: "number", min: "5", max: "25", step: "0.1", placeholder: "13.2" }))
        ]),
        U.el("p", { class: "err", id: "bErr" })
      ]);

      UI.openModal({
        title: "Book in a lot", body: body,
        actions: [
          { label: "Cancel", kind: "ghost" },
          { label: "Book in", onClick: function (b) {
              var wt = parseFloat(b.querySelector("#bWeight").value);
              var mo = parseFloat(b.querySelector("#bMoisture").value);
              var farmer = b.querySelector("#bFarmer").value.trim();
              var err = b.querySelector("#bErr");
              if (!(wt > 0)) { err.textContent = "Enter the weight in kilograms."; return false; }
              if (!(mo >= 5 && mo <= 25)) { err.textContent = "Moisture should be between 5% and 25%."; return false; }
              if (!farmer) { err.textContent = "Enter the supplier's name."; return false; }

              var T = STORE.state.thresholds;
              var lot = {
                id: "LOT-" + Math.floor(2650 + Math.random() * 300),
                crop: b.querySelector("#bCrop").value,
                variety: b.querySelector("#bVariety").value.trim() || "—",
                silo: b.querySelector("#bSilo").value,
                farmer: farmer,
                intakeDate: new Date().toISOString(),
                weightKg: Math.round(wt),
                intakeMoisture: mo, moisture: mo, lossPct: 0,
                status: mo > T.moistureMax ? "at-risk" : "storing"
              };
              API.createBatch(lot).then(function () {
                STORE.state.batches.unshift(lot);
                STORE.emit("batches", STORE.state.batches);
                STORE.log(lot.status === "at-risk" ? "warn" : "info",
                  lot.id + " booked in at " + U.kg(lot.weightKg) + " (" + mo + "% moisture)", "Intake desk");
                if (lot.status === "at-risk") {
                  UI.toast("Booked in — above the moisture cap", lot.id + " came in at " + mo + "% against a " + T.moistureMax + "% cap. Dry it before it sits.", "alert");
                } else {
                  UI.toast("Lot booked in", lot.id + " · " + U.kg(lot.weightKg) + " into " + lot.silo, "ok");
                }
              });
            } }
        ]
      });
    }
    function field(id, label, control) {
      return U.el("div", { class: "field" }, [U.el("label", { for: id, text: label }), control]);
    }

    function exportCSV() {
      var list = rows().map(function (b) {
        return {
          lot: b.id, crop: b.crop, variety: b.variety, bay: b.silo, supplier: b.farmer,
          intake_date: new Date(b.intakeDate).toISOString().slice(0, 10),
          days_in_store: b.days, weight_kg: b.weightKg,
          intake_moisture_pct: b.intakeMoisture, moisture_pct: b.moisture,
          loss_pct: b.lossPct, loss_kg: U.round(b.lossKg, 1),
          value_at_risk_ghs: Math.round(b.value), status: b.status
        };
      });
      var ok = U.downloadCSV("sentry-lots-" + new Date().toISOString().slice(0, 10) + ".csv", list);
      ok ? UI.toast("Export ready", list.length + " lots written to CSV.", "ok")
         : UI.toast("Nothing to export", "Adjust the filter and try again.", "alert");
    }

    /* ---------------- wire ---------------- */
    offs.push(STORE.on("batches", function () { paintTiles(); paintTable(); paintBays(); }));
    offs.push(STORE.on("silos", paintBays));
    paintTiles(); paintBays(); paintTable();

    return function destroy() { offs.forEach(function (f) { f(); }); };
  }

  w.PAGES = w.PAGES || {};
  w.PAGES.storage = { render: render, title: "Storage — Sentry", heroDark: true };
})(window);
