/* ============================================================
   SENTRY · components.js — shared interface pieces
   ============================================================ */
(function (w) {
  "use strict";
  var U = w.U, API = w.API, STORE = w.STORE, CFG = w.SENTRY_CONFIG, ICON = w.ICON;

  /* ------------------------------------------------------------
     TOAST
     ------------------------------------------------------------ */
  var toastHost = null;
  function toast(title, message, kind) {
    toastHost = toastHost || U.$("#toasts");
    if (!toastHost) return;
    var t = U.el("div", { class: "toast toast--" + (kind || "info") }, [
      U.el("div", {}, [
        U.el("div", { class: "toast__t", text: title }),
        message ? U.el("p", { class: "toast__m", text: message }) : null
      ])
    ]);
    toastHost.appendChild(t);
    setTimeout(function () {
      t.classList.add("is-out");
      setTimeout(function () { t.remove(); }, 320);
    }, kind === "alert" ? 5200 : 3600);
  }

  /* ------------------------------------------------------------
     MODAL
     openModal({ title, body(Node|string), actions:[{label,kind,onClick,close}] })
     ------------------------------------------------------------ */
  var modalPrevFocus = null;
  function openModal(cfg) {
    var m = U.$("#modal"), body = U.$("#modalBody"), foot = U.$("#modalFoot");
    U.$("#modalTitle").textContent = cfg.title || "";
    body.innerHTML = "";
    if (typeof cfg.body === "string") body.innerHTML = cfg.body;
    else if (cfg.body) body.appendChild(cfg.body);

    foot.innerHTML = "";
    (cfg.actions || []).forEach(function (a) {
      var b = U.el("button", {
        class: "btn " + (a.kind ? "btn--" + a.kind : ""), type: "button", text: a.label,
        onclick: function () {
          var keep = a.onClick && a.onClick(body) === false;
          if (a.close !== false && !keep) closeModal();
        }
      });
      foot.appendChild(b);
    });

    modalPrevFocus = document.activeElement;
    m.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(function () {
      var f = body.querySelector("input,select,textarea,button") || U.$(".modal__x");
      if (f) f.focus();
    }, 60);
    return { close: closeModal, body: body };
  }
  function closeModal() {
    var m = U.$("#modal");
    if (!m || m.hidden) return;
    m.hidden = true;
    document.body.style.overflow = "";
    if (modalPrevFocus && modalPrevFocus.focus) modalPrevFocus.focus();
  }
  function confirmAction(cfg) {
    return new Promise(function (resolve) {
      openModal({
        title: cfg.title,
        body: U.el("p", { text: cfg.message }),
        actions: [
          { label: cfg.cancelLabel || "Cancel", kind: "ghost", onClick: function () { resolve(false); } },
          { label: cfg.confirmLabel || "Confirm", kind: cfg.kind || "danger", onClick: function () { resolve(true); } }
        ]
      });
    });
  }

  /* ------------------------------------------------------------
     HEADER: nav, scroll state, connection pill
     ------------------------------------------------------------ */
  var headerReady = false;
  function initHeader() {
    if (headerReady) return;            /* never wire the header twice */
    headerReady = true;
    var head = U.$("#masthead"), nav = U.$("#mainnav"), btn = U.$("#navToggle"), scrim = U.$("#navScrim");

    function closeNav() {
      nav.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      scrim.hidden = true;
    }
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      scrim.hidden = !open;
    });
    scrim.addEventListener("click", closeNav);
    nav.addEventListener("click", function (e) { if (e.target.tagName === "A") closeNav(); });
    window.addEventListener("hashchange", closeNav);

    function onScroll() {
      head.classList.toggle("masthead--solid", window.scrollY > 24);
      if (window.scrollY > 24) head.classList.remove("masthead--over");
      else if (document.body.dataset.heroDark === "1") head.classList.add("masthead--over");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    w.SENTRY_syncHeader = onScroll;
    onScroll();

    U.$("#connPill").addEventListener("click", openConnectionSettings);
    API.onModeChange(paintPill);
    paintPill(API.state);
  }

  function paintPill(st) {
    var pill = U.$("#connPill"); if (!pill) return;
    var label = pill.querySelector(".connpill__label");
    pill.classList.remove("connpill--live", "connpill--mock", "connpill--down");
    if (st.mode === "live") { pill.classList.add("connpill--live"); label.textContent = "Live backend"; pill.title = "Connected to " + API.getBaseUrl(); }
    else if (st.mode === "down") { pill.classList.add("connpill--down"); label.textContent = "Backend down"; pill.title = st.lastError || "No response"; }
    else { pill.classList.add("connpill--mock"); label.textContent = "Mock data"; pill.title = "Running on sample data. Click to connect a backend."; }
    var f = U.$("#footerStatus");
    if (f) f.textContent = st.mode === "live" ? "Gateway streaming" : st.mode === "down" ? "Gateway unreachable" : "Sample data";
  }

  function openConnectionSettings() {
    var body = U.el("div", {}, [
      U.el("p", { text: "Point Sentry at your API. It is saved on this device, so you can change it without touching the code." }),
      U.el("div", { class: "field" }, [
        U.el("label", { for: "cfgBase", text: "API base URL" }),
        U.el("input", { class: "input", id: "cfgBase", type: "url", placeholder: "http://192.168.137.1:4000/api", value: API.getBaseUrl() })
      ]),
      U.el("div", { class: "field" }, [
        U.el("label", { for: "cfgToken", text: "Auth token (optional)" }),
        U.el("input", { class: "input", id: "cfgToken", type: "text", placeholder: "Bearer token", value: U.store.get("token", "") || "" })
      ]),
      U.el("p", { class: "err", id: "cfgNote",
        text: "Leave the URL blank to keep running on sample data." })
    ]);

    openModal({
      title: "Connection settings",
      body: body,
      actions: [
        { label: "Use sample data", kind: "ghost", onClick: function () {
            API.setBaseUrl(""); U.store.del("token");
            STORE.loadAll().then(function () { toast("Switched to sample data", "Every screen is now running on the bundled dummy set.", "info"); });
          } },
        { label: "Save and test", kind: "", onClick: function (b) {
            var url = b.querySelector("#cfgBase").value.trim();
            var tok = b.querySelector("#cfgToken").value.trim();
            tok ? U.store.set("token", tok) : U.store.del("token");
            API.setBaseUrl(url);
            if (!url) { toast("Sample data", "No URL given, so Sentry stays on mock data.", "info"); return; }
            toast("Testing connection…", url, "info");
            API.telemetry().then(function () {
              STORE.loadAll();
              if (API.isLive()) toast("Backend connected", "Live readings are coming through.", "ok");
              else toast("No response from that URL", "Sentry kept the sample data so the screens stay usable.", "alert");
            });
          } }
      ]
    });
  }

  /* ------------------------------------------------------------
     HERO CAROUSEL
     slides: [{ image, alt, eyebrow, title(html), lede, actions:[{label,href,kind}] }]
     ------------------------------------------------------------ */
  function heroCarousel(slides, opts) {
    opts = opts || {};
    var idx = 0, timer = null, DELAY = opts.delay || 6500;

    var slideWrap = U.el("div", { class: "hero__slides" });
    slides.forEach(function (s, i) {
      var pane = U.el("div", { class: "hero__slide" + (i === 0 ? " is-active" : ""), "aria-hidden": i !== 0 });
      pane.appendChild(U.img(s.image, s.alt || "", "hero__slideImg"));
      slideWrap.appendChild(pane);
    });

    var content = U.el("div", { class: "hero__content" });
    var eyebrow = U.el("p", { class: "eyebrow eyebrow--onDark" });
    var title   = U.el("h1", { class: "hero__title" });
    var rule    = U.el("div", { class: "hero__rule" });
    var lede    = U.el("p", { class: "hero__lede" });
    var acts    = U.el("div", { class: "hero__actions" });
    content.append(eyebrow, title, rule, lede, acts);

    function paint(i) {
      var s = slides[i];
      eyebrow.textContent = s.eyebrow || "";
      title.innerHTML = s.title;
      lede.textContent = s.lede || "";
      acts.innerHTML = "";
      (s.actions || []).forEach(function (a) {
        acts.appendChild(U.el("a", { class: "btn " + (a.kind === "ghost" ? "btn--onDark" : "btn--gold"), href: a.href, text: a.label }));
      });
      U.$$(".hero__slide", slideWrap).forEach(function (p, j) {
        p.classList.toggle("is-active", j === i);
        p.setAttribute("aria-hidden", String(j !== i));
      });
      U.$$(".hero__dot", dots).forEach(function (d, j) {
        d.classList.toggle("is-active", j === i);
        d.setAttribute("aria-selected", String(j === i));
      });
    }
    function go(n) { idx = (n + slides.length) % slides.length; paint(idx); restart(); }
    function restart() {
      clearInterval(timer);
      if (slides.length < 2) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      timer = setInterval(function () { if (!document.hidden) go(idx + 1); }, DELAY);
    }

    var dots = U.el("div", { class: "hero__dots", role: "tablist", "aria-label": "Hero slides" });
    slides.forEach(function (s, i) {
      dots.appendChild(U.el("button", {
        class: "hero__dot" + (i === 0 ? " is-active" : ""), type: "button", role: "tab",
        "aria-label": "Slide " + (i + 1), "aria-selected": i === 0,
        onclick: function () { go(i); }
      }));
    });

    var prev = U.el("button", { class: "hero__arrow hero__arrow--prev", type: "button", "aria-label": "Previous slide",
      html: ICON("arrowLeft", 22), onclick: function () { go(idx - 1); } });
    var next = U.el("button", { class: "hero__arrow hero__arrow--next", type: "button", "aria-label": "Next slide",
      html: ICON("arrowRight", 22), onclick: function () { go(idx + 1); } });

    var root = U.el("section", { class: "hero" + (opts.compact ? " hero--page" : "") }, [slideWrap, content, prev, next, dots]);
    root.addEventListener("mouseenter", function () { clearInterval(timer); });
    root.addEventListener("mouseleave", restart);
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") go(idx + 1);
      if (e.key === "ArrowLeft") go(idx - 1);
    });
    /* swipe */
    var x0 = null;
    root.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 46) go(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });

    paint(0); restart();
    root.addEventListener("sentry:destroy", function () { clearInterval(timer); });
    return root;
  }

  /* ------------------------------------------------------------
     SMALL BUILDERS reused across pages
     ------------------------------------------------------------ */
  function pageHero(cfg) {
    return U.el("section", { class: "pagehero" }, [
      U.el("div", { class: "pagehero__inner" }, [
        cfg.eyebrow ? U.el("p", { class: "eyebrow eyebrow--onDark", text: cfg.eyebrow }) : null,
        U.el("h1", { text: cfg.title }),
        cfg.lede ? U.el("p", { text: cfg.lede }) : null,
        cfg.chips && cfg.chips.length ? U.el("div", { class: "pagehero__meta" },
          cfg.chips.map(function (c) { return U.el("span", { class: "chip", text: c }); })) : null
      ])
    ]);
  }

  function metricTile(cfg) {
    var tile = U.el("div", { class: "metric" + (cfg.tone ? " metric--" + cfg.tone : "") }, [
      U.el("div", { class: "metric__label" }, [
        cfg.icon ? U.el("span", { html: ICON(cfg.icon, 15), style: "display:inline-flex" }) : null,
        document.createTextNode(cfg.label)
      ]),
      U.el("div", { class: "metric__value", html: U.esc(cfg.value) + (cfg.unit ? "<small>" + U.esc(cfg.unit) + "</small>" : "") }),
      cfg.foot ? U.el("div", { class: "metric__foot", text: cfg.foot }) : null
    ]);
    if (cfg.spark && cfg.spark.length > 1) {
      var s = U.el("div", { class: "metric__spark" });
      s.appendChild(w.CHART.sparkline(cfg.spark, cfg.sparkColor || "#0B5A2B"));
      tile.appendChild(s);
    }
    return tile;
  }

  function meter(name, value, max, tone) {
    var f = U.el("i", { class: "meter__fill" + (tone ? " meter__fill--" + tone : "") });
    var node = U.el("div", { class: "meter" }, [
      U.el("div", { class: "meter__top" }, [
        U.el("span", { class: "meter__name", text: name }),
        U.el("span", { class: "meter__num", text: U.num(value, 0) + "%" })
      ]),
      U.el("div", { class: "meter__track" }, [f])
    ]);
    U.raf(function () { f.style.width = U.clamp(value / (max || 100) * 100, 0, 100) + "%"; });
    return node;
  }

  function feedRow(item) {
    var iconName = { ok: "check", warn: "warn", alert: "warn", info: "info" }[item.level] || "info";
    return U.el("div", { class: "feed__row" }, [
      U.el("span", { class: "feed__time", text: "[" + U.clock(item.at) + "]" }),
      U.el("span", { class: "feed__icon feed__icon--" + item.level, html: ICON(iconName, 17) }),
      U.el("span", { class: "feed__text", text: item.text }),
      U.el("span", { class: "feed__tag", text: item.source || "" })
    ]);
  }

  function emptyState(text, actionLabel, onAction) {
    return U.el("div", { class: "tbl__empty" }, [
      U.el("p", { text: text }),
      actionLabel ? U.el("button", { class: "btn btn--ghost btn--sm", type: "button", text: actionLabel, onclick: onAction }) : null
    ]);
  }

  function segmented(options, current, onPick) {
    var wrap = U.el("div", { class: "seg", role: "group" });
    options.forEach(function (o) {
      wrap.appendChild(U.el("button", {
        type: "button", text: o.label, "aria-pressed": String(o.value === current),
        onclick: function () {
          U.$$("button", wrap).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          this.setAttribute("aria-pressed", "true");
          onPick(o.value);
        }
      }));
    });
    return wrap;
  }

  function switchControl(id, checked, onChange, gold) {
    var input = U.el("input", { type: "checkbox", id: id, checked: checked || false });
    var stateLbl = U.el("span", { class: "switch__state", text: checked ? "On" : "Off" });
    input.addEventListener("change", function () {
      stateLbl.textContent = input.checked ? "On" : "Off";
      onChange(input.checked, input);
    });
    var lab = U.el("label", { class: "switch" + (gold ? " switch--gold" : ""), for: id }, [
      input, U.el("span", { class: "switch__track" }), stateLbl
    ]);
    lab.setState = function (v) { input.checked = v; stateLbl.textContent = v ? "On" : "Off"; };
    return lab;
  }

  /* global modal wiring */
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-close-modal]")) closeModal();
    var s = e.target.closest('[data-action="open-settings"]');
    if (s) { e.preventDefault(); openConnectionSettings(); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });

  w.UI = {
    toast: toast, openModal: openModal, closeModal: closeModal, confirmAction: confirmAction,
    initHeader: initHeader, openConnectionSettings: openConnectionSettings,
    heroCarousel: heroCarousel, pageHero: pageHero,
    metricTile: metricTile, meter: meter, feedRow: feedRow, emptyState: emptyState,
    segmented: segmented, switchControl: switchControl
  };
})(window);
