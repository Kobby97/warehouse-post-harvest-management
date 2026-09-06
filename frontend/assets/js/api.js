/* ============================================================
   SENTRY · api.js
   ------------------------------------------------------------
   Every network call in the app goes through here. When
   API_BASE_URL is empty or unreachable, each call quietly
   returns the equivalent mock payload and the header pill
   switches to "Mock data".
   ============================================================ */
(function (w) {
  "use strict";
  var CFG = w.SENTRY_CONFIG, U = w.U, MOCK = w.MOCK;

  var state = {
    mode: "mock",      // "live" | "mock" | "down"
    lastError: null,
    lastOk: null
  };
  var listeners = [];
  function onModeChange(fn) { listeners.push(fn); }
  function setMode(m, err) {
    if (state.mode === m && !err) return;
    state.mode = m; state.lastError = err || null;
    listeners.forEach(function (fn) { try { fn(state); } catch (e) { } });
  }

  function base() { return (CFG.API_BASE_URL || "").replace(/\/+$/, ""); }
  function path(key, params) {
    var p = CFG.ENDPOINTS[key] || "/" + key;
    if (params) {
      for (var k in params) p = p.replace(":" + k, encodeURIComponent(params[k]));
    }
    return p;
  }
  function headers() {
    var h = { "Content-Type": "application/json", "Accept": "application/json" };
    var tok = U.store.get("token", null);
    if (tok) h[CFG.AUTH_HEADER] = CFG.AUTH_SCHEME + " " + tok;
    return h;
  }

  /* ---------- core request ---------- */
  function request(method, key, opts) {
    opts = opts || {};
    var url = base() + path(key, opts.params);
    if (opts.query) {
      var qs = Object.keys(opts.query)
        .filter(function (k) { return opts.query[k] !== undefined && opts.query[k] !== null; })
        .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(opts.query[k]); })
        .join("&");
      if (qs) url += (url.indexOf("?") === -1 ? "?" : "&") + qs;
    }

    if (!base()) return Promise.reject(new Error("NO_BACKEND"));

    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, CFG.REQUEST_TIMEOUT_MS);

    return fetch(url, {
      method: method,
      headers: headers(),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw new Error("HTTP " + res.status + " on " + url);
      return res.status === 204 ? null : res.json();
    }).then(function (json) {
      state.lastOk = Date.now();
      setMode("live");
      /* Accept both {data:…} envelopes and bare payloads. */
      return json && typeof json === "object" && "data" in json && Object.keys(json).length <= 3
        ? json.data : json;
    }).catch(function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  /* Try the network, fall back to mock. `fallback` is a function. */
  function withFallback(promiseFactory, fallback) {
    return promiseFactory().catch(function (err) {
      if (!CFG.ALLOW_MOCK_FALLBACK) { setMode("down", err.message); throw err; }
      setMode(base() ? "down" : "mock", err.message === "NO_BACKEND" ? null : err.message);
      if (base()) setMode("mock", err.message);
      return fallback();
    });
  }

  var API = {
    state: state,
    onModeChange: onModeChange,
    isLive: function () { return state.mode === "live"; },

    setBaseUrl: function (url) {
      CFG.API_BASE_URL = (url || "").trim();
      U.store.set("apiBase", CFG.API_BASE_URL);
      setMode(CFG.API_BASE_URL ? "live" : "mock");
      return CFG.API_BASE_URL;
    },
    getBaseUrl: function () { return CFG.API_BASE_URL || ""; },

    /* --- reads --- */
    telemetry: function () {
      return withFallback(function () { return request("GET", "telemetry"); }, function () { return MOCK.telemetry(); });
    },
    history: function (range) {
      return withFallback(function () { return request("GET", "telemetryHistory", { query: { range: range } }); },
        function () { return MOCK.history(range); });
    },
    silos: function () {
      return withFallback(function () { return request("GET", "silos"); }, function () { return MOCK.silos(); });
    },
    batches: function () {
      return withFallback(function () { return request("GET", "batches"); }, function () { return MOCK.batches(); });
    },
    alerts: function () {
      return withFallback(function () { return request("GET", "alerts"); }, function () { return MOCK.alerts(); });
    },
    activity: function () {
      return withFallback(function () { return request("GET", "activity"); }, function () { return MOCK.activity(); });
    },
    audit: function () {
      return withFallback(function () { return request("GET", "audit"); }, function () { return MOCK.audit(); });
    },
    metrics: function () {
      return withFallback(function () { return request("GET", "metrics"); }, function () { return MOCK.metrics(); });
    },
    actuators: function () {
      return withFallback(function () { return request("GET", "actuators"); }, function () { return MOCK.actuators(); });
    },
    recommendations: function () {
      return withFallback(function () { return request("GET", "recommendations"); }, function () { return MOCK.recommendations(); });
    },
    thresholds: function () {
      return withFallback(function () { return request("GET", "thresholds"); },
        function () { return Object.assign({}, CFG.THRESHOLDS); });
    },

    /* --- writes --- */
    setActuator: function (id, on) {
      return withFallback(
        function () { return request("PATCH", "actuatorSet", { params: { id: id }, body: { state: on } }); },
        function () { return MOCK.setActuator(id, on); });
    },
    setThresholds: function (body) {
      return withFallback(function () { return request("PUT", "thresholdSet", { body: body }); },
        function () { Object.assign(CFG.THRESHOLDS, body); return Object.assign({}, CFG.THRESHOLDS); });
    },
    setAutonomy: function (on) {
      return withFallback(function () { return request("POST", "autonomy", { body: { enabled: on } }); },
        function () { return { enabled: on }; });
    },
    emergencyStop: function () {
      return withFallback(function () { return request("POST", "emergencyStop", { body: { at: Date.now() } }); },
        function () { MOCK.allOff(); return { stopped: true }; });
    },
    systemReset: function () {
      return withFallback(function () { return request("POST", "systemReset", {}); },
        function () { return { reset: true }; });
    },
    actOnRecommendation: function (id, action) {
      return withFallback(
        function () { return request("POST", "recommendationAct", { params: { id: id }, body: { action: action } }); },
        function () { MOCK.removeRecommendation(id); return { id: id, action: action }; });
    },
    ackAlert: function (id) {
      return withFallback(function () { return request("POST", "alertAck", { params: { id: id } }); },
        function () { MOCK.setAlertState(id, "acknowledged"); return { id: id, state: "acknowledged" }; });
    },
    resolveAlert: function (id) {
      return withFallback(function () { return request("POST", "alertResolve", { params: { id: id } }); },
        function () { MOCK.setAlertState(id, "resolved"); return { id: id, state: "resolved" }; });
    },
    createBatch: function (body) {
      return withFallback(function () { return request("POST", "batchCreate", { body: body }); },
        function () { return MOCK.addBatch(body); });
    },
    dispatchBatch: function (id) {
      return withFallback(function () { return request("POST", "batchDispatch", { params: { id: id } }); },
        function () { return MOCK.dispatchBatch(id); });
    },
    sendContact: function (body) {
      return withFallback(function () { return request("POST", "contact", { body: body }); },
        function () { return U.sleep(700).then(function () { return { received: true, ref: "MSG-" + Date.now().toString(36).toUpperCase() }; }); });
    },

    /* --- realtime --- */
    socket: null,
    connectSocket: function (onMessage) {
      var url = CFG.WS_URL;
      if (!url) return null;
      if (url === "auto") {
        if (!base()) return null;
        url = base().replace(/^http/, "ws").replace(/\/api$/, "") + "/ws";
      }
      var retry = 0, sock = null, closed = false;

      function open() {
        try { sock = new WebSocket(url); } catch (e) { return schedule(); }
        API.socket = sock;
        sock.onopen = function () { retry = 0; setMode("live"); };
        sock.onmessage = function (ev) {
          try { onMessage(JSON.parse(ev.data)); } catch (e) { /* ignore malformed frame */ }
        };
        sock.onclose = function () { if (!closed) schedule(); };
        sock.onerror = function () { try { sock.close(); } catch (e) { } };
      }
      function schedule() {
        retry++;
        if (retry > 8) return;
        setTimeout(open, Math.min(15000, 800 * Math.pow(1.7, retry)));
      }
      open();
      return { close: function () { closed = true; if (sock) sock.close(); } };
    }
  };

  setMode(base() ? "live" : "mock");
  w.API = API;
})(window);
