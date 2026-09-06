/* ============================================================
   SENTRY · mock.js
   ------------------------------------------------------------
   Stand-in data with the SAME SHAPE the backend must return.
   Every object here is documented in README.md — match these
   keys on the server and the UI needs no further changes.
   The mock also drifts over time so charts and gauges move.
   ============================================================ */
(function (w) {
  "use strict";
  var CFG = w.SENTRY_CONFIG, U = w.U;

  var T0 = Date.now();
  function wobble(base, amp, speed, phase) {
    var t = (Date.now() - T0) / 1000;
    return base + Math.sin(t / (speed || 40) + (phase || 0)) * amp + (Math.random() - 0.5) * amp * 0.22;
  }

  /* ---------- storage units ---------- */
  var SILOS = [
    { id: "SILO-A", name: "Silo A — East bay",  crop: "Maize (Obatanpa)", capacityKg: 12000, weightKg: 9840, temperature: 32.4, humidity: 58.2, moisture: 13.9, co2: 1310, image: CFG.IMAGES.siloA, gateway: "ESP32-A1", lastSeen: Date.now() - 4000 },
    { id: "SILO-B", name: "Silo B — West bay",  crop: "Maize (Abontem)",  capacityKg: 12000, weightKg: 7210, temperature: 27.1, humidity: 55.4, moisture: 12.6, co2: 780,  image: CFG.IMAGES.siloB, gateway: "ESP32-B1", lastSeen: Date.now() - 9000 },
    { id: "SILO-C", name: "Silo C — Cowpea",    crop: "Cowpea",           capacityKg: 8000,  weightKg: 5120, temperature: 25.8, humidity: 61.9, moisture: 13.1, co2: 940,  image: CFG.IMAGES.siloC, gateway: "ESP32-C1", lastSeen: Date.now() - 6000 },
    { id: "SILO-D", name: "Silo D — Rice",      crop: "Paddy rice",       capacityKg: 10000, weightKg: 3060, temperature: 24.6, humidity: 52.1, moisture: 12.2, co2: 610,  image: CFG.IMAGES.siloD, gateway: "ESP32-D1", lastSeen: Date.now() - 11000 },
    { id: "SILO-E", name: "Silo E — Groundnut", crop: "Groundnut",        capacityKg: 6000,  weightKg: 4380, temperature: 28.9, humidity: 63.4, moisture: 13.4, co2: 1050, image: CFG.IMAGES.siloE, gateway: "ESP32-E1", lastSeen: Date.now() - 21000 },
    { id: "SILO-F", name: "Silo F — Overflow",  crop: "Empty",            capacityKg: 8000,  weightKg: 0,    temperature: 23.4, humidity: 48.0, moisture: 0,    co2: 430,  image: CFG.IMAGES.siloF, gateway: "ESP32-F1", lastSeen: Date.now() - 45000 }
  ];

  /* ---------- grain lots ---------- */
  var d = function (daysAgo) { return new Date(Date.now() - daysAgo * 86400000).toISOString(); };
  var BATCHES = [
    { id: "LOT-2607", crop: "Maize", variety: "Obatanpa", silo: "SILO-A", farmer: "Kwabena Antwi", intakeDate: d(41), weightKg: 4200, intakeMoisture: 14.8, moisture: 13.9, lossPct: 4.1, status: "at-risk" },
    { id: "LOT-2611", crop: "Maize", variety: "Obatanpa", silo: "SILO-A", farmer: "Ejisu Co-op",    intakeDate: d(33), weightKg: 5640, intakeMoisture: 13.6, moisture: 13.2, lossPct: 2.4, status: "storing" },
    { id: "LOT-2618", crop: "Maize", variety: "Abontem",  silo: "SILO-B", farmer: "Adwoa Mensah",   intakeDate: d(26), weightKg: 3810, intakeMoisture: 12.9, moisture: 12.6, lossPct: 1.2, status: "storing" },
    { id: "LOT-2623", crop: "Maize", variety: "Abontem",  silo: "SILO-B", farmer: "Yaw Boateng",    intakeDate: d(19), weightKg: 3400, intakeMoisture: 13.1, moisture: 12.7, lossPct: 0.9, status: "storing" },
    { id: "LOT-2630", crop: "Cowpea", variety: "Asontem", silo: "SILO-C", farmer: "Ejisu Co-op",    intakeDate: d(15), weightKg: 2600, intakeMoisture: 13.4, moisture: 13.1, lossPct: 3.3, status: "at-risk" },
    { id: "LOT-2634", crop: "Cowpea", variety: "Asontem", silo: "SILO-C", farmer: "Akua Owusu",     intakeDate: d(11), weightKg: 2520, intakeMoisture: 12.8, moisture: 12.9, lossPct: 1.1, status: "storing" },
    { id: "LOT-2641", crop: "Rice",  variety: "Jasmine 85", silo: "SILO-D", farmer: "Nsuta Farms",  intakeDate: d(8),  weightKg: 3060, intakeMoisture: 12.4, moisture: 12.2, lossPct: 0.6, status: "storing" },
    { id: "LOT-2645", crop: "Groundnut", variety: "Nkatiesari", silo: "SILO-E", farmer: "Kofi Agyei", intakeDate: d(6), weightKg: 4380, intakeMoisture: 13.9, moisture: 13.4, lossPct: 2.8, status: "at-risk" },
    { id: "LOT-2588", crop: "Maize", variety: "Obatanpa", silo: "SILO-A", farmer: "Kwabena Antwi", intakeDate: d(74), weightKg: 5100, intakeMoisture: 13.2, moisture: 12.8, lossPct: 1.8, status: "dispatched" },
    { id: "LOT-2594", crop: "Rice",  variety: "Jasmine 85", silo: "SILO-D", farmer: "Nsuta Farms",  intakeDate: d(66), weightKg: 2900, intakeMoisture: 12.6, moisture: 12.4, lossPct: 1.1, status: "dispatched" }
  ];

  /* ---------- actuators ---------- */
  var ACTUATORS = [
    { id: "fan",       name: "Ventilation fan",   description: "Pulls warm air out of the head space. First response when temperature climbs.", icon: "fan",     state: true,  pin: "GPIO 26" },
    { id: "aeration",  name: "Aeration cycle",    description: "Pushes ambient air up through the grain mass to even out hot spots.",           icon: "wind",    state: false, pin: "GPIO 27" },
    { id: "dehumid",   name: "Dehumidifier",      description: "Runs when relative humidity sits above the cap for more than 20 minutes.",      icon: "dehumid", state: true,  pin: "GPIO 14" },
    { id: "buzzer",    name: "Floor alarm",       description: "Audible alert in the store shed. Silence it only after you have inspected.",    icon: "bell",    state: false, pin: "GPIO 13" },
    { id: "lights",    name: "Bay lighting",      description: "Inspection lighting over the bays. Not part of the safety chain.",              icon: "bulb",    state: false, pin: "GPIO 12" },
    { id: "auger",     name: "Transfer auger",    description: "Moves grain between bays. Interlocked with the emergency stop.",                icon: "truck",   state: false, pin: "GPIO 25" }
  ];

  /* ---------- recommendations ---------- */
  var RECOMMENDATIONS = [
    { id: "REC-1", type: "cooling",  title: "Run aeration on Silo A tonight", body: "Silo A has held above 30 °C for 4 hours. Night aeration between 22:00 and 04:00 would drop the grain mass by roughly 3 °C using cool ambient air.", impact: "Cuts spoilage risk by an estimated 18%", action: "schedule", icon: "wind" },
    { id: "REC-2", type: "moisture", title: "Re-dry LOT-2607 before it is sold",  body: "Lot moisture is 13.9%, above the 13.5% safe cap. A single drying pass now protects about 4,200 kg from mould.", impact: "Protects ₵26,880 of stock", action: "apply", icon: "droplet" },
    { id: "REC-3", type: "handling", title: "Move Silo E stock forward in the queue", body: "Groundnut in Silo E is trending up on both temperature and moisture. Dispatching it before the maize reduces total exposure.", impact: "Shortens exposure by 12 days", action: "apply", icon: "route" },
    { id: "REC-4", type: "service",  title: "Inspect the Silo C load cell", body: "The HX711 on Silo C has drifted 0.4% against the last manual weighing. Recalibrate within 48 hours.", impact: "Restores weight accuracy", action: "schedule", icon: "wrench" }
  ];

  /* ---------- activity feed ---------- */
  var ACT_SEED = [
    { level: "alert", text: "Silo A temperature crossed the 30 °C cap", source: "DHT22 · SILO-A" },
    { level: "ok",    text: "Ventilation fan engaged automatically",    source: "Actuator · fan" },
    { level: "ok",    text: "Silo C load cell recalibrated",            source: "HX711 · SILO-C" },
    { level: "warn",  text: "Humidity sensor on Silo E reporting noise", source: "DHT22 · SILO-E" },
    { level: "ok",    text: "ESP32-B1 handshake verified",              source: "Gateway" },
    { level: "info",  text: "LOT-2641 booked in at 3,060 kg",           source: "Intake desk" },
    { level: "ok",    text: "Night aeration cycle completed on Silo B", source: "Actuator · aeration" },
    { level: "warn",  text: "Silo E moisture approaching the 13.5% cap", source: "DHT22 · SILO-E" }
  ];
  var ACTIVITY = ACT_SEED.map(function (a, i) {
    return { id: U.uid("act"), level: a.level, text: a.text, source: a.source, at: Date.now() - (i * 97000 + 15000) };
  });

  /* ---------- audit (threshold breaches) ---------- */
  var AUDIT = [
    { at: Date.now() - 3.1e6,  silo: "SILO-A", sensor: "DHT22 temperature", value: 32.4, unit: "°C", cap: 30.0, outcome: "Buzzer triggered", level: "alert" },
    { at: Date.now() - 8.4e6,  silo: "SILO-E", sensor: "DHT22 humidity",    value: 66.8, unit: "%",  cap: 65.0, outcome: "Dehumidifier engaged", level: "alert" },
    { at: Date.now() - 1.3e7,  silo: "SILO-A", sensor: "Grain moisture",    value: 13.9, unit: "%",  cap: 13.5, outcome: "Re-dry recommended", level: "alert" },
    { at: Date.now() - 2.0e7,  silo: "SILO-C", sensor: "Load cell HX711",   value: 5120, unit: "kg", cap: 8000, outcome: "Within capacity", level: "ok" },
    { at: Date.now() - 2.6e7,  silo: "SILO-B", sensor: "DHT22 humidity",    value: 55.4, unit: "%",  cap: 65.0, outcome: "Auto resolved", level: "ok" },
    { at: Date.now() - 3.4e7,  silo: "SILO-E", sensor: "CO₂ respiration",   value: 1310, unit: "ppm",cap: 1200, outcome: "Aeration scheduled", level: "warn" },
    { at: Date.now() - 4.1e7,  silo: "SILO-D", sensor: "DHT22 temperature", value: 24.6, unit: "°C", cap: 30.0, outcome: "Within range", level: "ok" },
    { at: Date.now() - 5.5e7,  silo: "SILO-A", sensor: "DHT22 temperature", value: 30.9, unit: "°C", cap: 30.0, outcome: "Fan engaged", level: "warn" }
  ].map(function (r) { return Object.assign({ id: U.uid("aud") }, r); });

  /* ---------- alerts ---------- */
  var ALERTS = [
    { id: "ALR-081", silo: "SILO-A", severity: "critical", title: "Silo A above temperature cap",     detail: "32.4 °C against a 30.0 °C cap, rising for 4 hours.", at: Date.now() - 3.1e6, state: "active" },
    { id: "ALR-080", silo: "SILO-E", severity: "warning",  title: "Silo E moisture near cap",          detail: "13.4% against a 13.5% cap.", at: Date.now() - 7.0e6, state: "active" },
    { id: "ALR-079", silo: "SILO-C", severity: "warning",  title: "Load cell drift on Silo C",         detail: "0.4% against last manual weighing.", at: Date.now() - 1.1e7, state: "acknowledged" },
    { id: "ALR-078", silo: "SILO-B", severity: "info",     title: "Aeration cycle finished on Silo B", detail: "Grain mass down 2.1 °C.", at: Date.now() - 1.9e7, state: "resolved" }
  ];

  /* ---------- history series ---------- */
  function history(range) {
    var spec = { "6h": [36, 10], "12h": [36, 20], "24h": [48, 30], "7d": [42, 240] }[range] || [48, 30];
    var pts = spec[0], stepMin = spec[1], out = [];
    for (var i = pts - 1; i >= 0; i--) {
      var at = Date.now() - i * stepMin * 60000;
      var hour = new Date(at).getHours();
      var diurnal = Math.sin((hour - 8) / 24 * Math.PI * 2);
      out.push({
        at: at,
        temperature: U.round(28.6 + diurnal * 3.4 + (pts - i) / pts * 1.6 + (Math.random() - .5) * .5, 1),
        humidity:    U.round(57.0 - diurnal * 4.2 + (Math.random() - .5) * 1.4, 1),
        moisture:    U.round(13.0 + (pts - i) / pts * 0.9 + (Math.random() - .5) * .12, 2),
        weightKg:    Math.round(9840 - (pts - i) * 0.7 + (Math.random() - .5) * 6),
        co2:         Math.round(900 + diurnal * 190 + (pts - i) / pts * 260 + (Math.random() - .5) * 60)
      });
    }
    return out;
  }

  /* ---------- live reading ---------- */
  function telemetry() {
    var a = SILOS[0];
    a.temperature = U.round(U.clamp(wobble(31.6, 1.5, 55, 0), 21, 38), 1);
    a.humidity    = U.round(U.clamp(wobble(57.5, 4.0, 70, 1.4), 40, 78), 1);
    a.moisture    = U.round(U.clamp(wobble(13.6, 0.35, 90, .6), 10.5, 15.5), 2);
    a.co2         = Math.round(U.clamp(wobble(1180, 190, 65, 2.1), 400, 2000));
    a.weightKg    = Math.round(U.clamp(a.weightKg + (Math.random() - .55) * 2.2, 0, a.capacityKg));
    a.lastSeen    = Date.now();

    SILOS.slice(1).forEach(function (s, i) {
      if (s.crop === "Empty") return;
      s.temperature = U.round(U.clamp(wobble(s.temperature, 0.45, 50, i), 19, 36), 1);
      s.humidity    = U.round(U.clamp(wobble(s.humidity, 1.6, 62, i + 2), 38, 76), 1);
      s.co2         = Math.round(U.clamp(wobble(s.co2, 70, 58, i + 3), 380, 1900));
      s.lastSeen    = Date.now() - Math.round(Math.random() * 12000);
    });

    return {
      at: Date.now(),
      siloId: a.id,
      temperature: a.temperature,
      humidity: a.humidity,
      moisture: a.moisture,
      weightKg: a.weightKg,
      co2: a.co2,
      gateway: a.gateway,
      online: true
    };
  }

  /* ---------- headline metrics ---------- */
  function metrics() {
    var active = BATCHES.filter(function (b) { return b.status !== "dispatched"; });
    var stored = active.reduce(function (n, b) { return n + b.weightKg; }, 0);
    var lostKg = active.reduce(function (n, b) { return n + b.weightKg * b.lossPct / 100; }, 0);
    var t = SILOS[0];
    var risk = U.riskIndex(t.temperature, t.humidity, t.moisture);
    return {
      grainStoredKg: Math.round(stored),
      lotsActive: active.length,
      lossToDateKg: Math.round(lostKg),
      lossToDatePct: U.round(lostKg / stored * 100, 1),
      valueAtRisk: Math.round(lostKg * CFG.ECONOMICS.pricePerKg),
      valueStored: Math.round(stored * CFG.ECONOMICS.pricePerKg),
      riskIndex: risk,
      riskTrendPerDay: 1.6,
      safeDays: U.safeDays(risk, 1.6),
      uptimePct: 99.2,
      actionsToday: 124,
      alertsActive: ALERTS.filter(function (a) { return a.state === "active"; }).length,
      recImplementedPct: 88,
      recPendingPct: 15,
      avgResponseSec: 406,
      capacityUsedPct: Math.round(
        SILOS.reduce(function (n, s) { return n + s.weightKg; }, 0) /
        SILOS.reduce(function (n, s) { return n + s.capacityKg; }, 0) * 100)
    };
  }

  function push(level, text, source) {
    var entry = { id: U.uid("act"), level: level, text: text, source: source || "Operator", at: Date.now() };
    ACTIVITY.unshift(entry);
    if (ACTIVITY.length > 80) ACTIVITY.pop();
    return entry;
  }

  w.MOCK = {
    silos: function () { return SILOS.map(function (s) { return Object.assign({}, s); }); },
    batches: function () { return BATCHES.map(function (b) { return Object.assign({}, b); }); },
    addBatch: function (b) { BATCHES.unshift(b); return b; },
    dispatchBatch: function (id) {
      var b = BATCHES.filter(function (x) { return x.id === id; })[0];
      if (b) b.status = "dispatched";
      return b;
    },
    actuators: function () { return ACTUATORS.map(function (a) { return Object.assign({}, a); }); },
    setActuator: function (id, state) {
      ACTUATORS.forEach(function (a) { if (a.id === id) a.state = state; });
      return { id: id, state: state };
    },
    allOff: function () { ACTUATORS.forEach(function (a) { a.state = false; }); },
    recommendations: function () { return RECOMMENDATIONS.map(function (r) { return Object.assign({}, r); }); },
    removeRecommendation: function (id) {
      for (var i = 0; i < RECOMMENDATIONS.length; i++) {
        if (RECOMMENDATIONS[i].id === id) { RECOMMENDATIONS.splice(i, 1); break; }
      }
    },
    activity: function () { return ACTIVITY.slice(0, 30); },
    audit: function () { return AUDIT.slice(); },
    alerts: function () { return ALERTS.map(function (a) { return Object.assign({}, a); }); },
    setAlertState: function (id, state) {
      ALERTS.forEach(function (a) { if (a.id === id) a.state = state; });
    },
    history: history,
    telemetry: telemetry,
    metrics: metrics,
    push: push
  };
})(window);
