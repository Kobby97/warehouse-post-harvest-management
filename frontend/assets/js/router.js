/* ============================================================
   SENTRY · router.js — hash routing, so the app runs from a
   file:// path or any static host with no server rewrites.
   ============================================================ */
(function (w) {
  "use strict";
  var U = w.U;

  var ROUTES = {
    "/":          "home",
    "/storage":   "storage",
    "/controls":  "controls",
    "/dashboard": "dashboard",
    "/contact":   "contact"
  };

  var current = null, destroyCurrent = null;

  function pathOf(hash) {
    var h = (hash || location.hash || "#/").replace(/^#/, "");
    h = h.split("?")[0];
    if (!h || h === "/") return "/";
    return "/" + h.replace(/^\/+|\/+$/g, "");
  }

  function notFound(mount) {
    document.body.dataset.heroDark = "1";
    mount.innerHTML = "";
    mount.appendChild(w.UI.pageHero({
      eyebrow: "Page not found",
      title: "That page isn't in the store",
      lede: "The link you followed doesn't match anything in Sentry. Everything lives on one of the four screens below."
    }));
    var links = [
      { href: "#/dashboard", label: "Dashboard", copy: "Live temperature, humidity, weight and spoilage risk for every bay." },
      { href: "#/storage", label: "Storage", copy: "Lots in the building, days in store, and what each one is losing." },
      { href: "#/controls", label: "Controls", copy: "Fans, aeration, the emergency stop and the safe operating window." },
      { href: "#/contact", label: "Contact", copy: "Reach the operations desk at the store." }
    ];
    mount.appendChild(U.el("section", { class: "section" }, [
      U.el("div", { class: "wrap" }, [
        U.el("div", { class: "grid grid--2" }, links.map(function (l) {
          return U.el("a", { class: "svc", href: l.href, style: "text-decoration:none;display:block" }, [
            U.el("h3", { text: l.label }),
            U.el("p", { text: l.copy })
          ]);
        })),
        U.el("div", { style: "margin-top:28px" }, [
          U.el("a", { class: "btn", href: "#/", text: "Back to the home page" })
        ])
      ])
    ]));
    return function () { };
  }

  function paintNav(path) {
    U.$$("[data-nav]").forEach(function (a) {
      if (a.dataset.nav === path) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function go(hash, opts) {
    var path = pathOf(hash);
    var key = ROUTES[path];
    var mount = U.$("#main");

    /* let the outgoing page release its subscriptions and timers */
    if (destroyCurrent) { try { destroyCurrent(); } catch (e) { } destroyCurrent = null; }
    U.$$(".hero", mount).forEach(function (n) { n.dispatchEvent(new CustomEvent("sentry:destroy")); });

    var page = key ? w.PAGES[key] : null;
    document.title = page ? page.title : "Not found — Sentry";
    document.body.dataset.heroDark = page && page.heroDark ? "1" : "0";

    destroyCurrent = page ? page.render(mount) : notFound(mount);
    current = path;
    paintNav(path);

    if (w.SENTRY_syncHeader) w.SENTRY_syncHeader();
    if (!opts || !opts.keepScroll) window.scrollTo({ top: 0, behavior: "auto" });

    /* move focus for screen-reader and keyboard users */
    mount.focus({ preventScroll: true });
  }

  function start() {
    /* A bare in-page anchor (#contactForm) is not a route — land on home. */
    if (!location.hash || location.hash.indexOf("/") === -1) go("#/");
    else go(location.hash);
    window.addEventListener("hashchange", function () {
      /* in-page anchors like #contactForm shouldn't re-render the route */
      var p = pathOf(location.hash);
      if (!ROUTES[p] && location.hash.indexOf("/") === -1) return;
      go(location.hash);
    });
  }

  w.ROUTER = { start: start, go: go, current: function () { return current; } };
})(window);
