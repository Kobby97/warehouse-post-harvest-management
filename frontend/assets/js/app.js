/* ============================================================
   SENTRY · app.js — boot sequence
   ============================================================ */
(function (w) {
  "use strict";
  var U = w.U, UI = w.UI, STORE = w.STORE, API = w.API, CFG = w.SENTRY_CONFIG;

  function bootSkeleton() {
    var mount = U.$("#main");
    mount.innerHTML =
      '<section class="section" style="padding-top:140px">' +
        '<div class="wrap">' +
          '<div class="skel skel--line" style="width:34%;height:28px"></div>' +
          '<div class="skel skel--line" style="width:62%"></div>' +
          '<div class="grid grid--4" style="margin-top:28px">' +
            '<div class="skel skel--card"></div><div class="skel skel--card"></div>' +
            '<div class="skel skel--card"></div><div class="skel skel--card"></div>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  /* Raise a toast the first time a bay crosses a cap, so the person
     hears about it even when they are on another screen. */
  function watchBreaches() {
    var announced = {};
    STORE.on("silos", function (silos) {
      var T = STORE.state.thresholds;
      silos.forEach(function (s) {
        if (!s.weightKg) return;
        var over = s.temperature >= T.tempMax || s.humidity >= T.humidityMax;
        if (over && !announced[s.id]) {
          announced[s.id] = true;
          var what = s.temperature >= T.tempMax
            ? "temperature at " + s.temperature + " °C"
            : "humidity at " + s.humidity + "%";
          UI.toast(s.id + " is above its cap", what + ". Grain in this bay is losing quality now.", "alert");
          STORE.log("alert", s.id + " crossed a cap — " + what, "Gateway");
        } else if (!over && announced[s.id]) {
          announced[s.id] = false;
          UI.toast(s.id + " is back inside the window", "Conditions have settled.", "ok");
          STORE.log("ok", s.id + " returned inside the safe window", "Gateway");
        }
      });
    });
  }

  function footerClock() {
    var n = U.$("#footerClock");
    if (!n) return;
    var tick = function () { n.textContent = U.stamp() + " GMT"; };
    tick(); setInterval(tick, 1000);
  }

  function keyboardShortcuts() {
    document.addEventListener("keydown", function (e) {
      if (e.target.matches("input,textarea,select")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var map = { d: "#/dashboard", s: "#/storage", c: "#/controls", h: "#/", k: "#/contact" };
      if (map[e.key.toLowerCase()]) { location.hash = map[e.key.toLowerCase()]; }
      if (e.key.toLowerCase() === "r") {
        STORE.refreshTelemetry().then(function () { UI.toast("Refreshed", "Latest reading pulled.", "info"); });
      }
    });
  }

  var booted = false;
  function boot() {
    if (booted) return;                 /* guard against a double DOMContentLoaded */
    booted = true;
    UI.initHeader();
    footerClock();
    bootSkeleton();
    watchBreaches();
    keyboardShortcuts();

    STORE.loadAll()
      .then(function () {
        w.ROUTER.start();
        STORE.startPolling();
        STORE.connectRealtime();
        if (!API.getBaseUrl()) {
          setTimeout(function () {
            UI.toast("Running on sample data",
              "Add your API URL in connection settings and every screen switches to live readings.", "info");
          }, 1400);
        }
      })
      .catch(function (err) {
        console.error(err);
        w.ROUTER.start();
        UI.toast("Could not load data", "Sentry is showing what it has. Check connection settings.", "alert");
      });

    /* pause polling in a background tab, catch up on return */
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && STORE.state.live) STORE.refreshTelemetry();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
