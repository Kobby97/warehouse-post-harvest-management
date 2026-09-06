/* ============================================================
   SENTRY · pages/home.js
   ============================================================ */
(function (w) {
  "use strict";
  var U = w.U, UI = w.UI, ICON = w.ICON, STORE = w.STORE, CFG = w.SENTRY_CONFIG;

  function render(mount) {
    var offs = [];
    document.body.dataset.heroDark = "1";
    mount.innerHTML = "";

    /* ---------------- hero ---------------- */
    mount.appendChild(UI.heroCarousel([
      {
        image: CFG.IMAGES.heroFarmer,
        alt: "A farmer walking through a green field of maize",
        eyebrow: "Post-harvest loss management",
        title: 'The harvest is only half<br>the <em>work</em>',
        lede: "A third of what Ghana grows never reaches a plate. Sentry watches stored grain for the heat and moisture that quietly eat it, and tells you what to do before the loss is locked in.",
        actions: [
          { label: "Open the dashboard", href: "#/dashboard" },
          { label: "See what's in store", href: "#/storage", kind: "ghost" }
        ]
      },
      {
        image: CFG.IMAGES.heroSilos,
        alt: "Grain bins and a storage elevator behind a field",
        eyebrow: "Every bay, every hour",
        title: 'Six bays.<br>One <em>readout</em>',
        lede: "Temperature, humidity, grain moisture and weight from an ESP32 in each bay — on one screen, whether you are in the office or standing on the shed floor.",
        actions: [
          { label: "View storage bays", href: "#/storage" },
          { label: "Take manual control", href: "#/controls", kind: "ghost" }
        ]
      },
      {
        image: CFG.IMAGES.heroGrain,
        alt: "Hands holding a scoop of harvested grain",
        eyebrow: "Measured in kilos, not dashboards",
        title: 'Know what a hot bay<br><em>costs</em> you',
        lede: "Every reading is converted into kilograms at risk and cedis at risk, so an alert is a business decision rather than a number on a screen.",
        actions: [
          { label: "See the loss ledger", href: "#/storage" },
          { label: "Talk to the team", href: "#/contact", kind: "ghost" }
        ]
      }
    ]));

    /* ---------------- live strip ---------------- */
    var stripCells = U.el("div", { class: "strip" });
    var stripSec = U.el("section", { class: "section section--tight" }, [
      U.el("div", { class: "wrap" }, [
        U.el("div", { class: "toolbar" }, [
          U.el("span", { class: "chip", id: "homePulse" }, [
            U.el("i", { class: "dot" }), document.createTextNode("Reading now")
          ]),
          U.el("span", { class: "chip chip--mute", text: CFG.FACILITY.name + " · " + CFG.FACILITY.region })
        ]),
        stripCells
      ])
    ]);
    mount.appendChild(stripSec);

    function paintStrip() {
      var m = STORE.state.metrics, t = STORE.state.telemetry;
      if (!m) return;
      var r = t ? U.riskIndex(t.temperature, t.humidity, t.moisture) : m.riskIndex;
      var lbl = U.riskLabel(r);
      stripCells.innerHTML = "";
      [
        { v: U.kg(m.grainStoredKg), k: "Grain in store" },
        { v: U.money(m.valueStored), k: "Value held" },
        { v: U.money(m.valueAtRisk), k: "Value at risk" },
        { v: lbl.word + " · " + r, k: "Spoilage risk index" }
      ].forEach(function (c) {
        stripCells.appendChild(U.el("div", { class: "strip__cell" }, [
          U.el("div", { class: "strip__v", text: c.v }),
          U.el("div", { class: "strip__k", text: c.k })
        ]));
      });
    }
    offs.push(STORE.on("metrics", paintStrip));
    offs.push(STORE.on("telemetry", paintStrip));
    paintStrip();

    /* ---------------- what Sentry watches ---------------- */
    var services = [
      { icon: "thermometer", h: "Conditions, continuously", p: "DHT22 probes in every bay report temperature and humidity. Sentry compares each reading against the safe window for that crop, not a generic one." },
      { icon: "scale", h: "Weight that means something", p: "HX711 load cells track the grain mass. A bay that quietly loses kilos is losing them to spillage, pests or shrinkage — and now you can see which." },
      { icon: "bug", h: "Spoilage risk, explained", p: "One index from heat, moisture and respiration. It tells you how many days of safe storage are left, and which reading is driving the number." },
      { icon: "wind", h: "Action, not just alarms", p: "Fans, aeration and dehumidifiers respond on their own when a cap is crossed. You can override any of it from the controls page in one tap." },
      { icon: "truck", h: "Lot-level traceability", p: "Every intake is a lot with a farmer, a date and a moisture reading, so you can dispatch the most exposed stock first instead of the nearest." },
      { icon: "activity", h: "A record that holds up", p: "Every breach, override and dispatch is timestamped and exportable, which matters when a buyer asks how the grain was kept." }
    ];
    mount.appendChild(U.el("section", { class: "section section--paper" }, [
      U.el("div", { class: "wrap" }, [
        U.el("div", { class: "section__head" }, [
          U.el("p", { class: "eyebrow", text: "What Sentry does" }),
          U.el("h2", { text: "Loss happens slowly. So we watch slowly, and constantly." }),
          U.el("p", { text: "Grain does not spoil in an instant. It spoils across days of slightly-too-warm, slightly-too-damp air. These are the six things Sentry keeps its eye on." })
        ]),
        U.el("div", { class: "grid grid--3" }, services.map(function (s) {
          return U.el("article", { class: "svc" }, [
            U.el("div", { class: "svc__icon", html: ICON(s.icon, 22) }),
            U.el("h3", { text: s.h }),
            U.el("p", { text: s.p })
          ]);
        }))
      ])
    ]));

    /* ---------------- bays at a glance ---------------- */
    var bayGrid = U.el("div", { class: "grid grid--3" });
    mount.appendChild(U.el("section", { class: "section section--husk2" }, [
      U.el("div", { class: "wrap" }, [
        U.el("div", { class: "section__head section__head--split" }, [
          U.el("div", {}, [
            U.el("p", { class: "eyebrow", text: "Right now" }),
            U.el("h2", { text: "Your bays at a glance" }),
            U.el("p", { text: "Live readings from each ESP32 gateway. Anything amber or red wants a decision today." })
          ]),
          U.el("a", { class: "btn btn--ghost", href: "#/storage", text: "Open storage" })
        ]),
        bayGrid
      ])
    ]));

    function paintBays() {
      var T = STORE.state.thresholds;
      bayGrid.innerHTML = "";
      var silos = STORE.state.silos.slice(0, 6);
      if (!silos.length) {
        for (var i = 0; i < 3; i++) bayGrid.appendChild(U.el("div", { class: "skel skel--card" }));
        return;
      }
      silos.forEach(function (s) {
        var empty = s.weightKg === 0;
        var lvl = empty ? "ok" : U.worstLevel([
          U.levelFor(s.temperature, T.tempMax, T.tempMax - 2),
          U.levelFor(s.humidity, T.humidityMax, T.humidityMax - 5)
        ]);
        var fillPct = Math.round(s.weightKg / s.capacityKg * 100);
        bayGrid.appendChild(U.el("article", { class: "card" }, [
          U.el("div", { class: "card__head" }, [
            U.el("span", { class: "card__title", text: s.id }),
            U.el("span", { class: "chip chip--" + (empty ? "mute" : lvl === "ok" ? "ok" : lvl) },
              [U.el("i", { class: "dot" }), document.createTextNode(empty ? "Empty" : U.LEVEL_WORD[lvl])])
          ]),
          U.el("div", { style: "font-family:var(--display);font-weight:800;font-size:19px;letter-spacing:-.02em" , text: s.crop }),
          U.el("div", { style: "display:flex;gap:20px;margin:14px 0 12px;font-family:var(--mono);font-size:14px" }, [
            U.el("span", { text: s.temperature + "°C" }),
            U.el("span", { text: s.humidity + "% RH" }),
            U.el("span", { text: U.kg(s.weightKg) })
          ]),
          UI.meter("Capacity used", fillPct, 100, fillPct > 90 ? "gold" : null)
        ]));
      });
    }
    offs.push(STORE.on("silos", paintBays));
    paintBays();

    /* ---------------- the one screen ---------------- */
    mount.appendChild(U.el("section", { class: "section section--paper" }, [
      U.el("div", { class: "wrap grid grid--split" }, [
        U.el("div", {}, [
          U.el("p", { class: "eyebrow", text: "Built for the person holding the keys" }),
          U.el("h2", { style: "font-size:clamp(28px,4vw,42px)", text: "One screen, and it answers the only question that matters" }),
          U.el("p", { style: "color:var(--ink-2);font-size:17px;margin-top:16px",
            text: "Is anything in this store going bad, and what do I do about it today? Everything else on the page is in service of that." }),
          U.el("ul", { class: "checklist" }, [
            "Live temperature, humidity, moisture and weight per bay",
            "Automatic fan, aeration and dehumidifier response",
            "Emergency stop that cuts every actuator in one press",
            "Loss in kilos and cedis, per lot and per bay",
            "Exportable breach log for buyers and auditors"
          ].map(function (t) {
            return U.el("li", {}, [U.el("span", { html: ICON("checkPlain", 18), style: "display:inline-flex" }), document.createTextNode(t)]);
          })),
          U.el("div", { style: "display:flex;gap:12px;flex-wrap:wrap;margin-top:28px" }, [
            U.el("a", { class: "btn", href: "#/dashboard", text: "Open the dashboard" }),
            U.el("a", { class: "btn btn--ghost", href: "#/controls", text: "Controls" })
          ])
        ]),
        U.el("div", { class: "media" }, [
          U.img(CFG.IMAGES.operators, "A worker moving a crate of produce in a store", ""),
          U.el("span", { class: "media__tag", text: CFG.FACILITY.name })
        ])
      ])
    ]));

    /* ---------------- about ---------------- */
    mount.appendChild(U.el("section", { class: "section section--husk2" }, [
      U.el("div", { class: "wrap grid grid--split" }, [
        U.el("div", { class: "media" }, [
          U.img(CFG.IMAGES.about, "A tractor and grain auger beside farm silos", ""),
          U.el("span", { class: "media__tag", text: "Ashanti Region" })
        ]),
        U.el("div", {}, [
          U.el("p", { class: "eyebrow", text: "About Sentry" }),
          U.el("h2", { style: "font-size:clamp(28px,4vw,42px)", text: "Made for stores that don't have a control room" }),
          U.el("p", { style: "color:var(--ink-2);font-size:16.5px;margin-top:16px",
            text: "Sentry started as a shed full of maize and a question nobody could answer without opening every bay: which of these is going off first? The hardware is deliberately cheap — an ESP32, a DHT22 and a load cell per bay — because a system nobody can afford to install prevents nothing." }),
          U.el("p", { style: "color:var(--ink-2);font-size:16.5px",
            text: "Green means the grain is fine, gold means look at it today, red means act now. Nothing on this screen is decorative." })
        ])
      ])
    ]));

    /* ---------------- CTA ---------------- */
    mount.appendChild(U.el("section", { class: "section section--field" }, [
      U.el("div", { class: "wrap", style: "text-align:center" }, [
        U.el("p", { class: "eyebrow eyebrow--onDark", text: "Get started" }),
        U.el("h2", { style: "font-size:clamp(28px,4.6vw,46px);max-width:20ch;margin-inline:auto", text: "Put a sentry in every bay before the next intake" }),
        U.el("p", { style: "color:rgba(255,255,255,.82);max-width:56ch;margin:18px auto 0;font-size:17px",
          text: "Tell us how many bays you run and what you store. We will size the gateways and get you reading in a week." }),
        U.el("div", { style: "display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:30px" }, [
          U.el("a", { class: "btn btn--gold", href: "#/contact", text: "Contact the team" }),
          U.el("a", { class: "btn btn--onDark", href: "#/dashboard", text: "Explore the dashboard" })
        ])
      ])
    ]));

    return function destroy() { offs.forEach(function (f) { f(); }); };
  }

  w.PAGES = w.PAGES || {};
  w.PAGES.home = { render: render, title: "Sentry — Post-harvest loss management", heroDark: true };
})(window);
