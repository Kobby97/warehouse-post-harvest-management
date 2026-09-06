/* ============================================================
   SENTRY · pages/dashboard.js
   The single screen a store manager keeps open.
   ============================================================ */
(function (w) {
  "use strict";
  var U = w.U, UI = w.UI, ICON = w.ICON, STORE = w.STORE, API = w.API, CHART = w.CHART, CFG = w.SENTRY_CONFIG;

  function render(mount) {
    var offs = [];
    document.body.dataset.heroDark = "1";
    mount.innerHTML = "";

    var range = U.store.get("range", "12h");
    var focusSilo = U.store.get("focusSilo", "SILO-A");
    var history = [];

    mount.appendChild(UI.pageHero({
      eyebrow: "Live telemetry",
      title: "Everything the store is telling you right now",
      lede: "Readings arrive from each ESP32 gateway over REST, with a websocket for the bays that support it. Nothing here is more than a few seconds old.",
      chips: [CFG.FACILITY.name, "DHT22 · HX711 · MQ-135", "Auto-refresh " + (CFG.POLL_MS / 1000) + "s"]
    }));

    /* ---------------- toolbar + banner ---------------- */
    var bannerBox = U.el("div", { style: "margin-bottom:20px" });
    var liveSwitch = UI.switchControl("liveSwitch", STORE.state.live, function (on) {
      STORE.setLive(on);
      UI.toast(on ? "Live updates on" : "Live updates paused",
        on ? "Readings refresh every " + (CFG.POLL_MS / 1000) + " seconds." : "The screen will hold the last reading until you resume.", "info");
    });
    var siloSelect = U.el("select", { class: "select", style: "width:auto;min-width:210px", "aria-label": "Focused bay" });
    siloSelect.addEventListener("change", function () {
      focusSilo = siloSelect.value;
      U.store.set("focusSilo", focusSilo);
      paintSensors(); paintGauge();
    });

    var toolbar = U.el("div", { class: "toolbar" }, [
      siloSelect,
      U.el("button", { class: "btn btn--ghost btn--sm", type: "button", html: ICON("refresh", 16) + "<span>Refresh now</span>",
        onclick: function () {
          STORE.refreshTelemetry().then(function () { UI.toast("Refreshed", "Pulled the latest reading from the gateway.", "ok"); });
        } }),
      U.el("div", { class: "toolbar__spacer" }),
      liveSwitch
    ]);

    mount.appendChild(U.el("section", { class: "section section--tight" }, [
      U.el("div", { class: "wrap" }, [toolbar, bannerBox])
    ]));

    function paintSiloSelect() {
      var cur = siloSelect.value || focusSilo;
      siloSelect.innerHTML = "";
      STORE.state.silos.forEach(function (s) {
        siloSelect.appendChild(U.el("option", { value: s.id, text: s.id + " — " + s.crop }));
      });
      if (STORE.state.silos.some(function (s) { return s.id === cur; })) siloSelect.value = cur;
      else if (STORE.state.silos[0]) { siloSelect.value = STORE.state.silos[0].id; focusSilo = siloSelect.value; }
    }

    function focused() {
      return STORE.siloById(focusSilo) || STORE.state.silos[0] || null;
    }

    function paintBanner() {
      var s = focused(), T = STORE.state.thresholds;
      bannerBox.innerHTML = "";
      if (!s) return;
      var tl = U.levelFor(s.temperature, T.tempMax, T.tempMax - 2);
      var hl = U.levelFor(s.humidity, T.humidityMax, T.humidityMax - 5);
      var worst = U.worstLevel([tl, hl]);

      if (STORE.state.emergency) {
        bannerBox.appendChild(banner("alert", "power", "Emergency stop is engaged",
          "Every actuator is off. Readings keep coming in, but nothing will respond until the stop is released.",
          [{ label: "Go to controls", href: "#/controls" }]));
        return;
      }
      if (worst === "ok") {
        bannerBox.appendChild(banner("ok", "check", "Conditions are inside the safe window",
          s.id + " is holding at " + s.temperature + " °C and " + s.humidity + "% RH, against caps of " +
          T.tempMax + " °C and " + T.humidityMax + "%.", []));
        return;
      }
      var reasons = [];
      if (tl !== "ok") reasons.push("temperature at " + s.temperature + " °C against a " + T.tempMax + " °C cap");
      if (hl !== "ok") reasons.push("humidity at " + s.humidity + "% against a " + T.humidityMax + "% cap");
      bannerBox.appendChild(banner(
        worst === "alert" ? "alert" : "warn",
        "warn",
        worst === "alert" ? s.id + " is outside the safe window" : s.id + " is drifting towards the cap",
        "Sentry is reading " + reasons.join(", ") + ". " +
          (worst === "alert" ? "Grain in this bay is losing quality now." : "Act today and this does not become a loss."),
        [
          { label: "Run aeration", onClick: function () { quickAerate(); } },
          { label: "Open controls", href: "#/controls", ghost: true }
        ]));
    }

    function banner(kind, icon, title, text, actions) {
      return U.el("div", { class: "banner" + (kind === "ok" ? " banner--ok" : kind === "warn" ? " banner--warn" : "") }, [
        U.el("span", { class: "banner__icon", html: ICON(icon, 22) }),
        U.el("div", { class: "banner__body" }, [
          U.el("div", { class: "banner__title", text: title }),
          U.el("p", { class: "banner__text", text: text }),
          actions && actions.length ? U.el("div", { class: "banner__actions" }, actions.map(function (a) {
            return a.href
              ? U.el("a", { class: "btn btn--sm " + (a.ghost ? "btn--ghost" : ""), href: a.href, text: a.label })
              : U.el("button", { class: "btn btn--sm " + (a.ghost ? "btn--ghost" : ""), type: "button", text: a.label, onclick: a.onClick });
          })) : null
        ]),
        U.el("span", { class: "chip chip--" + (kind === "ok" ? "ok" : kind), text: kind === "ok" ? "Stable" : kind === "warn" ? "Watch" : "Active" })
      ]);
    }

    function quickAerate() {
      if (STORE.state.emergency) {
        UI.toast("Blocked by the emergency stop", "Release the stop on the controls page first.", "alert");
        return;
      }
      Promise.all([API.setActuator("aeration", true), API.setActuator("fan", true)]).then(function () {
        STORE.state.actuators = STORE.state.actuators.map(function (a) {
          return (a.id === "aeration" || a.id === "fan") ? Object.assign({}, a, { state: true }) : a;
        });
        STORE.emit("actuators", STORE.state.actuators);
        STORE.log("ok", "Aeration and ventilation engaged on " + focusSilo, "Operator");
        UI.toast("Aeration running", "Fan and aeration are on for " + focusSilo + ". Expect the grain mass to drop over the next few hours.", "ok");
      });
    }

    /* ---------------- sensor cards ---------------- */
    var sensorGrid = U.el("div", { class: "grid grid--4" });
    mount.appendChild(U.el("section", { class: "section section--tight" }, [
      U.el("div", { class: "wrap" }, [sensorGrid])
    ]));

    function paintSensors() {
      var s = focused(), T = STORE.state.thresholds;
      sensorGrid.innerHTML = "";
      if (!s) { for (var i = 0; i < 4; i++) sensorGrid.appendChild(U.el("div", { class: "skel skel--card" })); return; }

      var tl = U.levelFor(s.temperature, T.tempMax, T.tempMax - 2);
      var hl = U.levelFor(s.humidity, T.humidityMax, T.humidityMax - 5);
      var ml = U.levelFor(s.moisture, T.moistureMax, T.moistureMax - 0.5);
      var tone = function (l) { return l === "alert" ? "alert" : l === "warn" ? "warn" : "ok"; };
      var hist = function (k) { return history.slice(-18).map(function (d) { return d[k]; }); };

      sensorGrid.appendChild(UI.metricTile({
        label: "Temperature · DHT22", value: s.temperature, unit: "°C", icon: "thermometer",
        tone: tone(tl), foot: U.LEVEL_WORD[tl] + " · cap " + T.tempMax + " °C",
        spark: hist("temperature"), sparkColor: tl === "alert" ? "#B4291D" : "#0B5A2B"
      }));
      sensorGrid.appendChild(UI.metricTile({
        label: "Humidity · DHT22", value: s.humidity, unit: "%RH", icon: "droplet",
        tone: tone(hl), foot: U.LEVEL_WORD[hl] + " · cap " + T.humidityMax + "%",
        spark: hist("humidity"), sparkColor: hl === "alert" ? "#B4291D" : "#0B5A2B"
      }));
      sensorGrid.appendChild(UI.metricTile({
        label: "Grain weight · HX711", value: U.num(s.weightKg), unit: "kg", icon: "scale",
        foot: Math.round(s.weightKg / s.capacityKg * 100) + "% of " + U.kg(s.capacityKg) + " capacity",
        spark: hist("weightKg")
      }));
      sensorGrid.appendChild(UI.metricTile({
        label: "Grain moisture", value: s.moisture ? s.moisture.toFixed(1) : "—", unit: "%", icon: "leaf",
        tone: tone(ml), foot: U.LEVEL_WORD[ml] + " · cap " + T.moistureMax + "%",
        spark: hist("moisture"), sparkColor: ml === "alert" ? "#B4291D" : "#0B5A2B"
      }));
    }

    /* ---------------- SIGNATURE: bin cross-section ---------------- */
    var gaugeMount = U.el("div", { class: "silogauge" });
    var factsMount = U.el("div", { class: "silofacts" });
    mount.appendChild(U.el("section", { class: "section section--paper" }, [
      U.el("div", { class: "wrap" }, [
        U.el("div", { class: "section__head" }, [
          U.el("p", { class: "eyebrow", text: "Spoilage risk" }),
          U.el("h2", { text: "How much grain, held in what air" }),
          U.el("p", { text: "The bin fills to the load-cell reading. The air above it warms from green through gold to red as the safe window is used up." })
        ]),
        U.el("div", { class: "card" }, [
          U.el("div", { class: "silobay" }, [gaugeMount, factsMount])
        ])
      ])
    ]));

    function paintGauge() {
      var s = focused(), T = STORE.state.thresholds;
      if (!s) return;
      CHART.siloGauge(gaugeMount, s, T);

      var risk = U.riskIndex(s.temperature, s.humidity, s.moisture || 12.5);
      var lbl = U.riskLabel(risk);
      var days = U.safeDays(risk, 1.6);
      var lotsHere = STORE.state.batches.filter(function (b) { return b.silo === s.id && b.status !== "dispatched"; });
      var exposedKg = lotsHere.reduce(function (n, b) { return n + b.weightKg; }, 0);

      factsMount.innerHTML = "";
      [
        { k: "Spoilage risk index", v: risk + " / 100", chip: lbl.word, level: lbl.level, bar: risk },
        { k: "Safe storage left", v: days + " days", sub: "at the current rate of drift" },
        { k: "Grain exposed in this bay", v: U.kg(exposedKg), sub: lotsHere.length + " lot" + (lotsHere.length === 1 ? "" : "s") },
        { k: "Value exposed", v: U.money(exposedKg * CFG.ECONOMICS.pricePerKg), sub: "at " + CFG.ECONOMICS.symbol + CFG.ECONOMICS.pricePerKg.toFixed(2) + " per kg" },
        { k: "Respiration CO₂", v: U.num(s.co2) + " ppm", sub: "cap " + T.co2Max + " ppm" },
        { k: "Gateway", v: s.gateway, sub: "last seen " + U.ago(s.lastSeen) }
      ].forEach(function (f) {
        var row = U.el("div", { class: "silofact" }, [
          U.el("span", { class: "silofact__k", text: f.k }),
          U.el("span", { class: "feed__tag", text: f.sub || "" }),
          f.chip
            ? U.el("span", { class: "chip chip--" + f.level, text: f.chip + " · " + f.v })
            : U.el("span", { class: "silofact__v", text: f.v })
        ]);
        if (typeof f.bar === "number") {
          var bar = U.el("span", { class: "silofact__bar" }, [U.el("i")]);
          row.appendChild(bar);
          U.raf(function () {
            var i = bar.querySelector("i");
            i.style.width = f.bar + "%";
            i.style.background = f.level === "alert" ? "var(--alert)" : f.level === "warn" ? "var(--gold)" : "var(--field)";
          });
        }
        factsMount.appendChild(row);
      });
    }

    /* ---------------- telemetry chart ---------------- */
    var chartMount = U.el("div", { class: "chart" });
    var rangePicker = UI.segmented(
      [{ value: "6h", label: "6h" }, { value: "12h", label: "12h" }, { value: "24h", label: "24h" }, { value: "7d", label: "7d" }],
      range,
      function (v) { range = v; U.store.set("range", v); loadHistory(); }
    );

    mount.appendChild(U.el("section", { class: "section section--husk2" }, [
      U.el("div", { class: "wrap" }, [
        U.el("div", { class: "card" }, [
          U.el("div", { class: "card__head" }, [
            U.el("span", { class: "card__title card__title--lg", text: "Temperature and humidity over time" }),
            rangePicker
          ]),
          chartMount
        ])
      ])
    ]));

    function loadHistory() {
      chartMount.innerHTML = '<div class="skel" style="height:240px"></div>';
      API.history(range).then(function (h) {
        history = h || [];
        var T = STORE.state.thresholds;
        CHART.lineChart(chartMount, {
          data: history, height: 250,
          ariaLabel: "Temperature and humidity over the last " + range,
          series: [
            { key: "temperature", label: "Temperature", color: "#0B5A2B", unit: " °C", dp: 1, cap: T.tempMax },
            { key: "humidity", label: "Humidity", color: "#E0A82E", unit: " %", dp: 1 }
          ]
        });
        paintSensors();
      });
    }

    /* ---------------- alerts + activity ---------------- */
    var alertBox = U.el("div", {});
    var feedBox = U.el("div", { class: "feed" });
    mount.appendChild(U.el("section", { class: "section section--paper" }, [
      U.el("div", { class: "wrap grid grid--sidebar" }, [
        U.el("div", { class: "card" }, [
          U.el("div", { class: "card__head" }, [
            U.el("span", { class: "card__title card__title--lg", text: "Open alerts" }),
            U.el("span", { class: "chip", id: "alertCount" })
          ]),
          alertBox
        ]),
        U.el("div", { class: "card" }, [
          U.el("div", { class: "card__head" }, [
            U.el("span", { class: "card__title card__title--lg", text: "Activity" }),
            U.el("span", { class: "chip chip--mute", text: "Live feed" })
          ]),
          feedBox
        ])
      ])
    ]));

    function paintAlerts() {
      var open = STORE.state.alerts.filter(function (a) { return a.state !== "resolved"; });
      var c = U.$("#alertCount"); if (c) c.textContent = open.length + " open";
      alertBox.innerHTML = "";
      if (!open.length) {
        alertBox.appendChild(UI.emptyState("No open alerts. Every bay is inside its safe window."));
        return;
      }
      open.forEach(function (a) {
        var lvl = a.severity === "critical" ? "alert" : a.severity === "warning" ? "warn" : "mute";
        alertBox.appendChild(U.el("div", { class: "rec" }, [
          U.el("span", { class: "rec__ico", style: "background:" + (lvl === "alert" ? "var(--alert)" : lvl === "warn" ? "var(--gold)" : "var(--field-soft)") + ";color:" + (lvl === "warn" ? "var(--ink)" : "#fff"),
            html: ICON(lvl === "alert" ? "warn" : "info", 18) }),
          U.el("div", { class: "rec__body" }, [
            U.el("div", { style: "display:flex;gap:9px;align-items:center;flex-wrap:wrap" }, [
              U.el("span", { class: "rec__title", text: a.title }),
              U.el("span", { class: "chip chip--" + lvl, text: a.silo })
            ]),
            U.el("p", { class: "rec__text", text: a.detail + " · " + U.ago(a.at) }),
            U.el("div", { class: "rec__acts" }, [
              a.state === "active" ? U.el("button", { class: "btn btn--ghost btn--xs", type: "button", text: "Acknowledge",
                onclick: function () {
                  API.ackAlert(a.id).then(function () {
                    STORE.state.alerts = STORE.state.alerts.map(function (x) { return x.id === a.id ? Object.assign({}, x, { state: "acknowledged" }) : x; });
                    STORE.emit("alerts", STORE.state.alerts);
                    STORE.log("info", "Alert acknowledged: " + a.title, a.silo);
                    UI.toast("Acknowledged", "The alarm stays open until the reading comes back inside the window.", "info");
                  });
                } }) : U.el("span", { class: "chip chip--mute", text: "Acknowledged" }),
              U.el("button", { class: "btn btn--xs", type: "button", text: "Resolve",
                onclick: function () {
                  API.resolveAlert(a.id).then(function () {
                    STORE.state.alerts = STORE.state.alerts.map(function (x) { return x.id === a.id ? Object.assign({}, x, { state: "resolved" }) : x; });
                    STORE.emit("alerts", STORE.state.alerts);
                    STORE.log("ok", "Alert resolved: " + a.title, a.silo);
                    UI.toast("Alert resolved", a.id + " closed.", "ok");
                  });
                } })
            ])
          ])
        ]));
      });
    }

    function paintFeed() {
      feedBox.innerHTML = "";
      var items = STORE.state.activity.slice(0, 12);
      if (!items.length) { feedBox.appendChild(UI.emptyState("Waiting for the first event.")); return; }
      items.forEach(function (it, i) {
        var row = UI.feedRow(it);
        if (i === 0) row.classList.add("is-new");
        feedBox.appendChild(row);
      });
    }

    /* ---------------- audit table ---------------- */
    var auditBody = U.el("tbody");
    var auditFilter = "all";
    var auditChips = U.el("div", { class: "filterchips" });
    [{ v: "all", l: "All" }, { v: "alert", l: "Breaches" }, { v: "warn", l: "Warnings" }, { v: "ok", l: "Resolved" }]
      .forEach(function (o) {
        auditChips.appendChild(U.el("button", {
          class: "filterchip", type: "button", text: o.l, "aria-pressed": String(auditFilter === o.v),
          onclick: function () {
            auditFilter = o.v;
            U.$$(".filterchip", auditChips).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
            this.setAttribute("aria-pressed", "true");
            paintAudit();
          }
        }));
      });

    mount.appendChild(U.el("section", { class: "section section--husk2" }, [
      U.el("div", { class: "wrap" }, [
        U.el("div", { class: "section__head section__head--split" }, [
          U.el("div", {}, [
            U.el("p", { class: "eyebrow", text: "Record" }),
            U.el("h2", { text: "Threshold breach log" }),
            U.el("p", { text: "Every time a reading crossed a cap, what Sentry did about it, and when. Export it when a buyer asks how the grain was kept." })
          ]),
          U.el("div", { style: "display:flex;gap:10px;flex-wrap:wrap;align-items:center" }, [
            auditChips,
            U.el("button", { class: "btn btn--ghost btn--sm", type: "button", html: ICON("download", 16) + "<span>Export</span>",
              onclick: function () {
                var rows = auditRows().map(function (r) {
                  return { timestamp: U.stamp(r.at), bay: r.silo, sensor: r.sensor, value: r.value, unit: r.unit, cap: r.cap, outcome: r.outcome, level: r.level };
                });
                U.downloadCSV("sentry-breach-log-" + new Date().toISOString().slice(0, 10) + ".csv", rows)
                  ? UI.toast("Export ready", rows.length + " entries written to CSV.", "ok")
                  : UI.toast("Nothing to export", "No entries match that filter.", "alert");
              } })
          ])
        ]),
        U.el("div", { class: "tablewrap" }, [
          U.el("table", { class: "tbl" }, [
            U.el("thead", {}, [U.el("tr", {}, ["Timestamp", "Bay", "Sensor", "Logged value", "Cap", "What happened"].map(function (h) {
              return U.el("th", { text: h });
            }))]),
            auditBody
          ])
        ])
      ])
    ]));

    function auditRows() {
      return STORE.state.audit.filter(function (r) { return auditFilter === "all" || r.level === auditFilter; });
    }
    function paintAudit() {
      var rows = auditRows();
      auditBody.innerHTML = "";
      if (!rows.length) {
        auditBody.appendChild(U.el("tr", {}, [U.el("td", { colspan: 6 }, [UI.emptyState("No entries at that level.")])]));
        return;
      }
      rows.forEach(function (r) {
        var breach = r.level === "alert";
        auditBody.appendChild(U.el("tr", { class: breach ? "is-breach" : "" }, [
          U.el("td", {}, [U.el("span", { class: "num", text: U.stamp(r.at) })]),
          U.el("td", {}, [U.el("span", { class: "num strong", text: r.silo })]),
          U.el("td", { text: r.sensor }),
          U.el("td", {}, [U.el("span", { class: "num" + (breach ? " breachval" : ""), text: U.num(r.value, r.unit === "kg" || r.unit === "ppm" ? 0 : 1) + " " + r.unit })]),
          U.el("td", {}, [U.el("span", { class: "num", text: U.num(r.cap, r.unit === "kg" || r.unit === "ppm" ? 0 : 1) + " " + r.unit })]),
          U.el("td", {}, [U.el("span", { class: "chip chip--" + (r.level === "ok" ? "ok" : r.level), text: r.outcome })])
        ]));
      });
    }

    /* ---------------- performance ---------------- */
    var perfGrid = U.el("div", { class: "grid grid--3" });
    mount.appendChild(U.el("section", { class: "section section--paper" }, [
      U.el("div", { class: "wrap" }, [
        U.el("div", { class: "section__head" }, [
          U.el("p", { class: "eyebrow", text: "System" }),
          U.el("h2", { text: "How Sentry itself is doing" })
        ]),
        perfGrid
      ])
    ]));

    function paintPerf() {
      var m = STORE.state.metrics;
      perfGrid.innerHTML = "";
      if (!m) { for (var i = 0; i < 3; i++) perfGrid.appendChild(U.el("div", { class: "skel skel--card" })); return; }

      perfGrid.appendChild(U.el("div", { class: "card" }, [
        U.el("div", { class: "card__head" }, [U.el("span", { class: "card__title", text: "Recommendation outcomes" })]),
        UI.meter("Implemented", m.recImplementedPct, 100),
        UI.meter("Still pending", m.recPendingPct, 100, "gold")
      ]));
      perfGrid.appendChild(U.el("div", { class: "card" }, [
        U.el("div", { class: "card__head" }, [U.el("span", { class: "card__title", text: "Gateway health" })]),
        UI.meter("Uptime", m.uptimePct, 100),
        UI.meter("Capacity in use", m.capacityUsedPct, 100, "gold")
      ]));
      perfGrid.appendChild(U.el("div", { class: "card" }, [
        U.el("div", { class: "card__head" }, [U.el("span", { class: "card__title", text: "Today" })]),
        U.el("div", { class: "grid grid--2", style: "gap:12px" }, [
          UI.metricTile({ label: "Actions", value: U.num(m.actionsToday), icon: "activity" }),
          UI.metricTile({ label: "Avg response", value: U.num(m.avgResponseSec), unit: "s", icon: "clock" })
        ])
      ]));
    }

    /* ---------------- wire ---------------- */
    function paintLive() { paintBanner(); paintSensors(); paintGauge(); }
    offs.push(STORE.on("silos", function () { paintSiloSelect(); paintLive(); }));
    offs.push(STORE.on("telemetry", paintLive));
    offs.push(STORE.on("thresholds", function () { paintLive(); loadHistory(); }));
    offs.push(STORE.on("alerts", paintAlerts));
    offs.push(STORE.on("activity", paintFeed));
    offs.push(STORE.on("audit", paintAudit));
    offs.push(STORE.on("metrics", paintPerf));
    offs.push(STORE.on("batches", paintGauge));

    paintSiloSelect(); paintLive(); paintAlerts(); paintFeed(); paintAudit(); paintPerf(); loadHistory();

    return function destroy() { offs.forEach(function (f) { f(); }); };
  }

  w.PAGES = w.PAGES || {};
  w.PAGES.dashboard = { render: render, title: "Dashboard — Sentry", heroDark: true };
})(window);
