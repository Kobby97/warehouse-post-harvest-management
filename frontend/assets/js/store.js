/* ============================================================
   SENTRY · store.js — one place where the app's state lives
   Views subscribe; the poll loop and websocket write.
   ============================================================ */
(function (w) {
  "use strict";
  var CFG = w.SENTRY_CONFIG, U = w.U, API = w.API;

  var state = {
    telemetry: null,
    silos: [],
    batches: [],
    actuators: [],
    recommendations: [],
    activity: [],
    audit: [],
    alerts: [],
    metrics: null,
    thresholds: Object.assign({}, CFG.THRESHOLDS),
    autonomy: U.store.get("autonomy", false),
    emergency: false,
    live: U.store.get("live", true),
    loaded: false
  };

  var subs = {};   // channel -> [fn]
  function on(channel, fn) {
    (subs[channel] = subs[channel] || []).push(fn);
    return function off() {
      subs[channel] = (subs[channel] || []).filter(function (f) { return f !== fn; });
    };
  }
  function emit(channel, payload) {
    (subs[channel] || []).forEach(function (fn) { try { fn(payload, state); } catch (e) { console.error(e); } });
    (subs["*"] || []).forEach(function (fn) { try { fn(channel, state); } catch (e) { } });
  }

  /* ---------- derived ---------- */
  function currentLevels() {
    var t = state.telemetry, T = state.thresholds;
    if (!t) return { temp: "ok", hum: "ok", moist: "ok", worst: "ok" };
    var lv = {
      temp:  U.levelFor(t.temperature, T.tempMax, T.tempMax - 2),
      hum:   U.levelFor(t.humidity, T.humidityMax, T.humidityMax - 5),
      moist: U.levelFor(t.moisture, T.moistureMax, T.moistureMax - 0.5)
    };
    lv.worst = U.worstLevel([lv.temp, lv.hum, lv.moist]);
    return lv;
  }
  function risk() {
    var t = state.telemetry;
    return t ? U.riskIndex(t.temperature, t.humidity, t.moisture) : 0;
  }
  function siloById(id) {
    return state.silos.filter(function (s) { return s.id === id; })[0] || null;
  }

  /* ---------- log a local action into the feed ---------- */
  function log(level, text, source) {
    var entry = { id: U.uid("act"), level: level, text: text, source: source || "Operator", at: Date.now() };
    state.activity.unshift(entry);
    if (state.activity.length > 60) state.activity.pop();
    if (w.MOCK) w.MOCK.push(level, text, source);
    emit("activity", state.activity);
    return entry;
  }

  /* ---------- loading ---------- */
  function loadAll() {
    return Promise.all([
      API.telemetry(), API.silos(), API.batches(), API.actuators(),
      API.recommendations(), API.activity(), API.audit(), API.alerts(),
      API.metrics(), API.thresholds()
    ]).then(function (r) {
      state.telemetry = r[0];
      state.silos = r[1] || [];
      state.batches = r[2] || [];
      state.actuators = r[3] || [];
      state.recommendations = r[4] || [];
      state.activity = r[5] || [];
      state.audit = r[6] || [];
      state.alerts = r[7] || [];
      state.metrics = r[8];
      state.thresholds = Object.assign({}, CFG.THRESHOLDS, r[9] || {});
      state.loaded = true;
      emit("all", state);
      ["telemetry", "silos", "batches", "actuators", "recommendations",
        "activity", "audit", "alerts", "metrics", "thresholds"].forEach(function (c) { emit(c, state[c]); });
      return state;
    });
  }

  function refreshTelemetry() {
    return Promise.all([API.telemetry(), API.silos(), API.metrics()]).then(function (r) {
      state.telemetry = r[0];
      state.silos = r[1] || state.silos;
      state.metrics = r[2] || state.metrics;
      emit("telemetry", state.telemetry);
      emit("silos", state.silos);
      emit("metrics", state.metrics);
      return state.telemetry;
    }).catch(function () { /* keep last good reading on screen */ });
  }

  /* ---------- poll loop ---------- */
  var timer = null;
  function startPolling() {
    stopPolling();
    if (!state.live) return;
    timer = setInterval(function () {
      if (document.hidden) return;   // don't burn the phone battery in a background tab
      refreshTelemetry();
    }, CFG.POLL_MS);
  }
  function stopPolling() { if (timer) { clearInterval(timer); timer = null; } }
  function setLive(on) {
    state.live = !!on;
    U.store.set("live", state.live);
    on ? startPolling() : stopPolling();
    emit("live", state.live);
  }

  /* ---------- websocket ---------- */
  function connectRealtime() {
    return API.connectSocket(function (msg) {
      if (!msg || !msg.type) return;
      switch (msg.type) {
        case "telemetry":
          state.telemetry = msg.payload; emit("telemetry", state.telemetry); break;
        case "silos":
          state.silos = msg.payload; emit("silos", state.silos); break;
        case "alert":
          state.alerts.unshift(msg.payload); emit("alerts", state.alerts);
          log(msg.payload.severity === "critical" ? "alert" : "warn", msg.payload.title, msg.payload.silo || "Gateway");
          break;
        case "activity":
          state.activity.unshift(msg.payload); emit("activity", state.activity); break;
        case "actuator":
          state.actuators = state.actuators.map(function (a) {
            return a.id === msg.payload.id ? Object.assign({}, a, { state: msg.payload.state }) : a;
          });
          emit("actuators", state.actuators); break;
        case "metrics":
          state.metrics = msg.payload; emit("metrics", state.metrics); break;
      }
    });
  }

  w.STORE = {
    state: state, on: on, emit: emit, log: log,
    loadAll: loadAll, refreshTelemetry: refreshTelemetry,
    startPolling: startPolling, stopPolling: stopPolling, setLive: setLive,
    connectRealtime: connectRealtime,
    currentLevels: currentLevels, risk: risk, siloById: siloById
  };
})(window);
