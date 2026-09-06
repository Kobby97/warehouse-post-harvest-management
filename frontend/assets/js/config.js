/* ============================================================
   SENTRY · config.js
   ------------------------------------------------------------
   THIS IS THE ONLY FILE YOU EDIT WHEN YOU ATTACH THE BACKEND.
   Set API_BASE_URL to your server, and Sentry will use live data.
   If the server can't be reached, it falls back to mock data and
   shows an amber "Mock data" pill in the header.

   The connection settings dialog in the app writes an override
   into localStorage, so you can also point it at a new IP at
   runtime without editing this file.
   ============================================================ */

window.SENTRY_CONFIG = {

  /* ---- where the backend lives ------------------------------
     Examples:
       "http://localhost:4000/api"
       "http://192.168.137.1:4000/api"   (Windows Mobile Hotspot)
       "https://sentry-api.onrender.com/api"
     Leave "" to run purely on mock data.                       */
  API_BASE_URL: "http://localhost:8080/api/v1/sentry",

  /* ---- realtime ---------------------------------------------
     Leave "" to disable. Auto-derived from API_BASE_URL when set
     to "auto" (http -> ws, https -> wss, path /ws).            */
  WS_URL: "auto",

  /* ---- behaviour ------------------------------------------- */
  POLL_MS: 5000,          // how often to re-read telemetry when no websocket
  REQUEST_TIMEOUT_MS: 6000,
  ALLOW_MOCK_FALLBACK: true,   // set false in production to surface real errors

  /* ---- auth (optional) --------------------------------------
     If your backend needs a token, put it here or let the app
     read one from localStorage under "sentry.token".           */
  AUTH_HEADER: "Authorization",
  AUTH_SCHEME: "Bearer",

  /* ---- endpoint map -----------------------------------------
     Change the right-hand strings to match your routes. Every
     network call in the app goes through one of these keys.    */
  ENDPOINTS: {
    telemetry:        "/telemetry/latest",     // GET  -> current sensor reading
    telemetryHistory: "/telemetry/history",    // GET  ?range=6h|12h|24h|7d
    silos:            "/silos",                // GET  -> array of storage units
    batches:          "/batches",              // GET  -> array of grain lots
    batchCreate:      "/batches",              // POST -> create a lot
    batchDispatch:    "/batches/:id/dispatch", // POST -> mark lot dispatched
    alerts:           "/alerts",               // GET  -> array of alerts
    alertAck:         "/alerts/:id/ack",       // POST -> acknowledge
    alertResolve:     "/alerts/:id/resolve",   // POST -> resolve
    activity:         "/activity",             // GET  -> action + alert feed
    audit:            "/audit",                // GET  -> threshold breach log
    metrics:          "/metrics/summary",      // GET  -> headline numbers
    actuators:        "/actuators",            // GET  -> actuator states
    actuatorSet:      "/actuators/:id",        // PATCH{state:boolean}
    thresholds:       "/thresholds",           // GET
    thresholdSet:     "/thresholds",           // PUT  {tempMax,humidityMax,...}
    autonomy:         "/system/autonomy",      // POST {enabled:boolean}
    emergencyStop:    "/system/emergency-stop",// POST
    systemReset:      "/system/reset",         // POST
    recommendations:  "/recommendations",      // GET
    recommendationAct:"/recommendations/:id",  // POST {action:"apply"|"schedule"|"dismiss"}
    contact:          "/contact"               // POST {name,email,facility,topic,message}
  },

  /* ---- safe operating window --------------------------------
     Defaults only. Overwritten by GET /thresholds when live.   */
  THRESHOLDS: {
    tempMax: 30.0,        // °C  — above this, insects and mould accelerate
    tempMin: 10.0,
    humidityMax: 65.0,    // %RH — above this, mould risk climbs sharply
    humidityMin: 40.0,
    moistureMax: 13.5,    // % grain moisture, safe long-term storage
    co2Max: 1200          // ppm — respiration spike = active spoilage
  },

  /* ---- commercial assumptions used for loss valuation ------- */
  ECONOMICS: {
    currency: "GHS",
    symbol: "₵",
    pricePerKg: 6.40,     // farm-gate maize price
    locale: "en-GH"
  },

  FACILITY: {
    name: "Ejisu Grain Store",
    operator: "Sentry",
    region: "Ashanti Region, Ghana",
    address: "Plot 14, Kumasi–Accra Road, Ejisu, Ghana",
    phone: "+233 30 274 1180",
    email: "operations@sentry.gh",
    hours: "Mon–Sat, 06:00–18:00 GMT"
  },

  /* ---- imagery (Unsplash CDN, no watermarks) ---------------- */
  IMAGES: {
    heroFarmer:  "https://images.unsplash.com/photo-1741874299706-2b8e16839aaa?fm=jpg&q=75&w=2000&auto=format&fit=crop",
    heroSilos:   "https://images.unsplash.com/photo-1694105073180-9e7dc1a83fbe?fm=jpg&q=75&w=2000&auto=format&fit=crop",
    heroGrain:   "https://images.unsplash.com/photo-1710149484964-d966b771c204?fm=jpg&q=75&w=2000&auto=format&fit=crop",
    about:       "https://images.unsplash.com/photo-1762291264773-3d3de89989ae?fm=jpg&q=75&w=1400&auto=format&fit=crop",
    operators:   "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?fm=jpg&q=75&w=1400&auto=format&fit=crop",
    contact:     "https://images.unsplash.com/photo-1509099381441-ea3c0cf98b94?fm=jpg&q=75&w=1800&auto=format&fit=crop",
    siloA:       "https://images.unsplash.com/photo-1731012375536-60f029a8e00d?fm=jpg&q=72&w=900&auto=format&fit=crop",
    siloB:       "https://images.unsplash.com/photo-1560848372-4c11f7f917b2?fm=jpg&q=72&w=900&auto=format&fit=crop",
    siloC:       "https://images.unsplash.com/photo-1772839440662-435d850a2bac?fm=jpg&q=72&w=900&auto=format&fit=crop",
    siloD:       "https://images.unsplash.com/photo-1657862894929-054f58276057?fm=jpg&q=72&w=900&auto=format&fit=crop",
    siloE:       "https://images.unsplash.com/photo-1731012375572-7bfd6c82f582?fm=jpg&q=72&w=900&auto=format&fit=crop",
    siloF:       "https://images.unsplash.com/photo-1582655731961-96d9af5795ab?fm=jpg&q=72&w=900&auto=format&fit=crop",
    field:       "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?fm=jpg&q=72&w=1200&auto=format&fit=crop"
  }
};

/* localStorage override, set from the in-app connection dialog */
(function () {
  try {
    var saved = localStorage.getItem("sentry.apiBase");
    if (saved !== null) window.SENTRY_CONFIG.API_BASE_URL = saved;
  } catch (e) { /* private mode — ignore */ }
})();
