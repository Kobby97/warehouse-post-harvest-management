/* ============================================================
   SENTRY · pages/controls.js
   Everything on this page sends a command and writes a log line.
   ============================================================ */
(function (w) {
  "use strict";
  var U = w.U, UI = w.UI, ICON = w.ICON, STORE = w.STORE, API = w.API, CFG = w.SENTRY_CONFIG;

  function render(mount) {
    var offs = [];
    document.body.dataset.heroDark = "1";
    mount.innerHTML = "";

    mount.appendChild(UI.pageHero({
      eyebrow: "Controls",
      title: "Take the store off automatic",
      lede: "Sentry runs the fans and dehumidifiers on its own. When you need to override it — during loading, fumigation or a fault — do it here.",
      chips: ["Six actuators", "Emergency stop", "Adjustable safe window"]
    }));

    /* ---------------- emergency + autonomy ---------------- */
    var estopCard, autoCard, autoSwitch;
    var emergencyBanner = U.el("div", { style: "margin-bottom:20px" });

    function buildTop() {
      var stopBtn = U.el("button", {
        class: "btn btn--danger btn--block", type: "button",
        html: ICON("power", 18) + "<span>" + (STORE.state.emergency ? "Release emergency stop" : "Emergency stop — cut everything") + "</span>",
        onclick: onEmergency
      });
      estopCard = U.el("div", { class: "ctrl ctrl--danger" }, [
        U.el("div", { class: "ctrl__top" }, [
          U.el("span", { class: "ctrl__ico", html: ICON("power", 21) }),
          U.el("div", {}, [
            U.el("div", { class: "ctrl__name", text: "Emergency stop" }),
            U.el("div", { class: "feed__tag", text: "Cuts power to every actuator" })
          ])
        ]),
        U.el("p", { class: "ctrl__desc", text: "Stops fans, augers and dehumidifiers immediately and holds them off until you release it. Use this when someone is inside a bay or a belt has jammed." }),
        stopBtn
      ]);

      autoSwitch = UI.switchControl("autonomySwitch", STORE.state.autonomy, onAutonomy, true);
      autoCard = U.el("div", { class: "ctrl ctrl--gold" + (STORE.state.autonomy ? " is-on" : "") }, [
        U.el("div", { class: "ctrl__top" }, [
          U.el("span", { class: "ctrl__ico", html: ICON("robot", 21) }),
          U.el("div", {}, [
            U.el("div", { class: "ctrl__name", text: "Autonomous mode" }),
            U.el("div", { class: "feed__tag", text: "Sentry acts without asking" })
          ])
        ]),
        U.el("p", { class: "ctrl__desc", text: "The onboard planner engages ventilation and aeration the moment a cap is crossed, instead of waiting for you. Sentry keeps monitoring either way, and you can take control back at any time." }),
        U.el("div", { class: "ctrl__foot" }, [autoSwitch, U.el("span", { class: "feed__tag", id: "autoState" })])
      ]);
      paintAutoState();
    }
    function paintAutoState() {
      var n = U.$("#autoState");
      if (n) n.textContent = STORE.state.autonomy ? "Planner in control" : "Manual only";
      if (autoCard) autoCard.classList.toggle("is-on", STORE.state.autonomy);
    }

    function onEmergency() {
      if (STORE.state.emergency) {
        UI.confirmAction({
          title: "Release the emergency stop?",
          message: "Actuators will accept commands again. Make sure the bays are clear and nobody is working inside before you release.",
          confirmLabel: "Release stop", kind: ""
        }).then(function (ok) {
          if (!ok) return;
          API.systemReset().then(function () {
            STORE.state.emergency = false;
            STORE.log("ok", "Emergency stop released — actuators re-armed", "Operator");
            UI.toast("Stop released", "Controls are live again. Autonomy is still off until you switch it on.", "ok");
            STORE.emit("actuators", STORE.state.actuators);
            paintAll();
          });
        });
        return;
      }
      UI.confirmAction({
        title: "Cut power to every actuator?",
        message: "Fans, aeration, the dehumidifier and the transfer auger stop immediately. Grain will keep warming while they are off, so release the stop as soon as it is safe.",
        confirmLabel: "Stop everything", kind: "danger"
      }).then(function (ok) {
        if (!ok) return;
        API.emergencyStop().then(function () {
          STORE.state.emergency = true;
          STORE.state.autonomy = false;
          U.store.set("autonomy", false);
          STORE.state.actuators = STORE.state.actuators.map(function (a) { return Object.assign({}, a, { state: false }); });
          STORE.log("alert", "EMERGENCY STOP — all actuators de-energised", "Operator");
          UI.toast("Emergency stop engaged", "Every actuator is off and autonomy has been switched out.", "alert");
          STORE.emit("actuators", STORE.state.actuators);
          paintAll();
        });
      });
    }

    function onAutonomy(on) {
      if (STORE.state.emergency && on) {
        autoSwitch.setState(false);
        UI.toast("Blocked by the emergency stop", "Release the stop before handing control back to the planner.", "alert");
        return;
      }
      API.setAutonomy(on).then(function () {
        STORE.state.autonomy = on;
        U.store.set("autonomy", on);
        STORE.log(on ? "ok" : "info", on ? "Autonomous mode engaged — planner has control" : "Autonomous mode released — manual only", "Operator");
        UI.toast(on ? "Autonomy on" : "Autonomy off",
          on ? "Sentry will act on breaches without waiting for you." : "Nothing will move unless you move it.", on ? "ok" : "info");
        paintAutoState();
      });
    }

    buildTop();
    mount.appendChild(U.el("section", { class: "section section--tight" }, [
      U.el("div", { class: "wrap" }, [
        emergencyBanner,
        U.el("div", { class: "grid grid--2" }, [estopCard, autoCard])
      ])
    ]));

    function paintEmergencyBanner() {
      emergencyBanner.innerHTML = "";
      if (!STORE.state.emergency) return;
      emergencyBanner.appendChild(U.el("div", { class: "banner" }, [
        U.el("span", { class: "banner__icon", html: ICON("power", 22) }),
        U.el("div", { class: "banner__body" }, [
          U.el("div", { class: "banner__title", text: "Emergency stop is engaged" }),
          U.el("p", { class: "banner__text", text: "No actuator will respond until the stop is released. Grain temperature will continue to climb in the meantime." })
        ])
      ]));
    }

    /* ---------------- actuators ---------------- */
    var actGrid = U.el("div", { class: "grid grid--3" });
    mount.appendChild(U.el("section", { class: "section section--paper" }, [
      U.el("div", { class: "wrap" }, [
        U.el("div", { class: "section__head section__head--split" }, [
          U.el("div", {}, [
            U.el("p", { class: "eyebrow", text: "Actuators" }),
            U.el("h2", { text: "Six things you can switch" }),
            U.el("p", { text: "Each toggle sends a command to the ESP32 on that circuit and writes a line into the action log." })
          ]),
          U.el("button", { class: "btn btn--ghost btn--sm", type: "button", html: ICON("refresh", 16) + "<span>Re-read states</span>",
            onclick: function () {
              API.actuators().then(function (a) {
                STORE.state.actuators = a; STORE.emit("actuators", a);
                UI.toast("Actuator states re-read", "Pulled straight from the gateway.", "info");
              });
            } })
        ]),
        actGrid
      ])
    ]));

    function paintActuators() {
      actGrid.innerHTML = "";
      if (!STORE.state.actuators.length) {
        for (var i = 0; i < 3; i++) actGrid.appendChild(U.el("div", { class: "skel skel--card" }));
        return;
      }
      STORE.state.actuators.forEach(function (a) {
        var sw = UI.switchControl("act_" + a.id, a.state, function (on, input) {
          if (STORE.state.emergency) {
            input.checked = false;
            sw.setState(false);
            UI.toast("Blocked by the emergency stop", "Release the stop before switching " + a.name.toLowerCase() + ".", "alert");
            return;
          }
          API.setActuator(a.id, on).then(function () {
            STORE.state.actuators = STORE.state.actuators.map(function (x) {
              return x.id === a.id ? Object.assign({}, x, { state: on }) : x;
            });
            STORE.log("ok", a.name + (on ? " engaged" : " switched off"), "Actuator · " + a.id);
            UI.toast(a.name + (on ? " on" : " off"), a.pin + " · command acknowledged", on ? "ok" : "info");
            STORE.emit("actuators", STORE.state.actuators);
          });
        });
        actGrid.appendChild(U.el("article", { class: "ctrl" + (a.state ? " is-on" : "") }, [
          U.el("div", { class: "ctrl__top" }, [
            U.el("span", { class: "ctrl__ico", html: ICON(a.icon || "power", 20) }),
            U.el("div", {}, [
              U.el("div", { class: "ctrl__name", text: a.name }),
              U.el("div", { class: "feed__tag", text: a.pin || "" })
            ])
          ]),
          U.el("p", { class: "ctrl__desc", text: a.description }),
          U.el("div", { class: "ctrl__foot" }, [sw])
        ]));
      });
    }

    /* ---------------- safe window ---------------- */
    var sliderBox = U.el("div", { class: "card" });
    function buildSliders() {
      var T = Object.assign({}, STORE.state.thresholds);
      var specs = [
        { k: "tempMax", label: "Temperature cap", min: 20, max: 40, step: 0.5, unit: " °C",
          help: "Above this, insect activity and mould growth accelerate sharply." },
        { k: "humidityMax", label: "Humidity cap", min: 45, max: 85, step: 1, unit: " %RH",
          help: "The single strongest driver of mould in stored maize." },
        { k: "moistureMax", label: "Grain moisture cap", min: 10, max: 18, step: 0.1, unit: " %",
          help: "13.5% is the usual ceiling for safe long-term maize storage." },
        { k: "co2Max", label: "Respiration CO₂ cap", min: 600, max: 3000, step: 50, unit: " ppm",
          help: "A rising CO₂ reading means the grain mass is actively respiring." }
      ];
      sliderBox.innerHTML = "";
      sliderBox.appendChild(U.el("div", { class: "card__head" }, [
        U.el("span", { class: "card__title card__title--lg", text: "Safe operating window" }),
        U.el("span", { class: "chip chip--mute", text: "Applies to every bay" })
      ]));
      var pending = Object.assign({}, T);
      specs.forEach(function (s) {
        var val = U.el("span", { class: "slider__val", text: T[s.k] + s.unit });
        var range = U.el("input", { type: "range", min: s.min, max: s.max, step: s.step, value: T[s.k],
          "aria-label": s.label });
        range.addEventListener("input", function () {
          pending[s.k] = parseFloat(range.value);
          val.textContent = range.value + s.unit;
        });
        sliderBox.appendChild(U.el("div", { class: "slider", style: "margin-bottom:20px" }, [
          U.el("div", { class: "slider__top" }, [U.el("span", { class: "field__label", text: s.label }), val]),
          range,
          U.el("p", { class: "ctrl__desc", style: "margin:0", text: s.help })
        ]));
      });
      sliderBox.appendChild(U.el("div", { style: "display:flex;gap:10px;flex-wrap:wrap;margin-top:6px" }, [
        U.el("button", { class: "btn btn--sm", type: "button", text: "Save window", onclick: function () {
            API.setThresholds(pending).then(function (saved) {
              STORE.state.thresholds = Object.assign({}, STORE.state.thresholds, saved || pending);
              STORE.emit("thresholds", STORE.state.thresholds);
              STORE.log("info", "Safe window updated — temp cap " + STORE.state.thresholds.tempMax + " °C, humidity cap " + STORE.state.thresholds.humidityMax + "%", "Operator");
              UI.toast("Window saved", "Alerts across every screen now use these caps.", "ok");
            });
          } }),
        U.el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Reset to recommended", onclick: function () {
            API.setThresholds({
              tempMax: 30, humidityMax: 65, moistureMax: 13.5, co2Max: 1200
            }).then(function () {
              STORE.state.thresholds = Object.assign({}, STORE.state.thresholds, { tempMax: 30, humidityMax: 65, moistureMax: 13.5, co2Max: 1200 });
              STORE.emit("thresholds", STORE.state.thresholds);
              buildSliders();
              UI.toast("Back to recommended", "30 °C, 65% RH, 13.5% moisture, 1200 ppm.", "info");
            });
          } })
      ]));
    }

    /* ---------------- action log + recommendations ---------------- */
    var logBox = U.el("div", { class: "feed" });
    var recBox = U.el("div", {});

    mount.appendChild(U.el("section", { class: "section section--husk2" }, [
      U.el("div", { class: "wrap grid grid--sidebar" }, [
        U.el("div", { class: "grid", style: "gap:18px" }, [
          U.el("div", { class: "card" }, [
            U.el("div", { class: "card__head" }, [
              U.el("span", { class: "card__title card__title--lg", text: "Action log" }),
              U.el("span", { class: "chip chip--mute", text: "Newest first" })
            ]),
            logBox
          ]),
          sliderBox
        ]),
        U.el("div", { class: "card" }, [
          U.el("div", { class: "card__head" }, [
            U.el("span", { class: "card__title card__title--lg", text: "What Sentry suggests" }),
            U.el("span", { class: "chip", id: "recCount" })
          ]),
          recBox
        ])
      ])
    ]));

    function paintLog() {
      logBox.innerHTML = "";
      var items = STORE.state.activity.slice(0, 14);
      if (!items.length) { logBox.appendChild(UI.emptyState("Nothing has happened yet today.")); return; }
      items.forEach(function (it, i) {
        var row = UI.feedRow(it);
        if (i === 0) row.classList.add("is-new");
        logBox.appendChild(row);
      });
    }

    function paintRecs() {
      recBox.innerHTML = "";
      var recs = STORE.state.recommendations;
      var count = U.$("#recCount");
      if (count) count.textContent = recs.length + " open";
      if (!recs.length) {
        recBox.appendChild(UI.emptyState("Nothing outstanding. Sentry will raise a suggestion when a reading starts to drift."));
        return;
      }
      recs.forEach(function (r) {
        var node = U.el("div", { class: "rec" }, [
          U.el("span", { class: "rec__ico", html: ICON(r.icon || "sparkles", 18) }),
          U.el("div", { class: "rec__body" }, [
            U.el("div", { class: "rec__title", text: r.title }),
            U.el("p", { class: "rec__text", text: r.body }),
            r.impact ? U.el("p", { class: "rec__text", style: "color:var(--gold-ink);font-weight:600", text: r.impact }) : null,
            U.el("div", { class: "rec__acts" }, [
              U.el("button", { class: "btn btn--sm", type: "button",
                text: r.action === "schedule" ? "Schedule it" : "Apply now",
                onclick: function () { act(r, r.action, node); } }),
              U.el("button", { class: "btn btn--ghost btn--xs", type: "button", text: "Dismiss",
                onclick: function () { act(r, "dismiss", node); } })
            ])
          ])
        ]);
        recBox.appendChild(node);
      });
    }

    function act(r, action, node) {
      API.actOnRecommendation(r.id, action).then(function () {
        node.classList.add("is-leaving");
        setTimeout(function () {
          STORE.state.recommendations = STORE.state.recommendations.filter(function (x) { return x.id !== r.id; });
          STORE.emit("recommendations", STORE.state.recommendations);
        }, 340);
        var word = action === "dismiss" ? "dismissed" : action === "schedule" ? "scheduled" : "applied";
        STORE.log(action === "dismiss" ? "info" : "ok", "Recommendation " + word + ": " + r.title, "Planner");
        UI.toast(
          action === "dismiss" ? "Suggestion dismissed" : action === "schedule" ? "Scheduled" : "Applied",
          action === "dismiss" ? "Sentry will raise it again if the reading gets worse." : r.impact || r.title,
          action === "dismiss" ? "info" : "ok"
        );
      });
    }

    /* ---------------- wire ---------------- */
    function paintAll() { paintEmergencyBanner(); paintActuators(); paintAutoState(); }
    offs.push(STORE.on("actuators", paintActuators));
    offs.push(STORE.on("activity", paintLog));
    offs.push(STORE.on("recommendations", paintRecs));
    offs.push(STORE.on("thresholds", buildSliders));
    paintAll(); buildSliders(); paintLog(); paintRecs();

    return function destroy() { offs.forEach(function (f) { f(); }); };
  }

  w.PAGES = w.PAGES || {};
  w.PAGES.controls = { render: render, title: "Controls — Sentry", heroDark: true };
})(window);
