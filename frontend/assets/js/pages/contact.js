/* ============================================================
   SENTRY · pages/contact.js
   ============================================================ */
(function (w) {
  "use strict";
  var U = w.U, UI = w.UI, ICON = w.ICON, API = w.API, STORE = w.STORE, CFG = w.SENTRY_CONFIG;

  function render(mount) {
    document.body.dataset.heroDark = "1";
    mount.innerHTML = "";
    var F = CFG.FACILITY;

    mount.appendChild(UI.heroCarousel([
      {
        image: CFG.IMAGES.contact,
        alt: "A farmer working in a green field",
        eyebrow: "Contact",
        title: 'Tell us what you<br><em>store</em>',
        lede: "How many bays, what crop, and how long it usually sits. We will size the gateways and tell you honestly whether Sentry is worth it for your store.",
        actions: [{ label: "Send a message", href: "#contactForm" }]
      },
      {
        image: CFG.IMAGES.field,
        alt: "A worker harvesting in a field",
        eyebrow: "Support",
        title: 'A sensor gone <em>quiet?</em>',
        lede: "If a gateway has dropped off the dashboard, call the operations line. Someone answers during store hours, every day the store is open.",
        actions: [{ label: "Call operations", href: "tel:" + F.phone.replace(/\s/g, "") }]
      }
    ], { compact: true, delay: 7500 }));

    /* ---------------- contact cards ---------------- */
    var cards = [
      { icon: "pin", h: "Visit us", p: "Come to the operations office at the store. Bring a sample and we will read its moisture while you wait.", val: F.address, href: null },
      { icon: "phone", h: "Call us", p: "An operator answers during store hours. Out of hours, the alarm still reaches the on-call phone.", val: F.phone, href: "tel:" + F.phone.replace(/\s/g, "") },
      { icon: "mail", h: "Email us", p: "Send the details of your store and we will come back within one working day.", val: F.email, href: "mailto:" + F.email }
    ];
    mount.appendChild(U.el("section", { class: "section section--paper" }, [
      U.el("div", { class: "wrap grid grid--3" }, cards.map(function (c) {
        return U.el("article", { class: "card contactcard" }, [
          U.el("div", { class: "contactcard__ico", html: ICON(c.icon, 24) }),
          U.el("h3", { text: c.h }),
          U.el("p", { text: c.p }),
          c.href ? U.el("a", { href: c.href, text: c.val }) : U.el("span", { class: "val", text: c.val })
        ]);
      }))
    ]));

    /* ---------------- form ---------------- */
    var form = buildForm();
    mount.appendChild(U.el("section", { class: "section section--husk2", id: "contactForm" }, [
      U.el("div", { class: "wrap grid grid--split" }, [
        U.el("div", {}, [
          U.el("p", { class: "eyebrow", text: "Send a message" }),
          U.el("h2", { style: "font-size:clamp(28px,4vw,42px)", text: "What are you trying to stop losing?" }),
          U.el("p", { style: "color:var(--ink-2);font-size:16.5px;margin-top:16px",
            text: "The more you tell us about the store — bay count, crop, how long grain typically sits before it moves — the more useful our answer will be." }),
          U.el("div", { class: "card", style: "margin-top:26px" }, [
            U.el("div", { class: "card__head" }, [U.el("span", { class: "card__title", text: "Operations desk" })]),
            U.el("div", { class: "silofacts" }, [
              row("Facility", F.name), row("Region", F.region), row("Hours", F.hours), row("Phone", F.phone)
            ])
          ])
        ]),
        U.el("div", { class: "card" }, [form])
      ])
    ]));

    function row(k, v) {
      return U.el("div", { class: "silofact" }, [
        U.el("span", { class: "silofact__k", text: k }),
        U.el("span", {}),
        U.el("span", { style: "font-weight:600;font-size:14.5px;text-align:right", text: v })
      ]);
    }

    function field(id, label, control, hint) {
      var f = U.el("div", { class: "field" }, [
        U.el("label", { for: id, text: label }), control,
        U.el("p", { class: "err", id: id + "Err", text: "" })
      ]);
      if (hint) f.insertBefore(U.el("p", { class: "err", style: "color:var(--ink-3)", text: hint }), f.children[2]);
      return f;
    }

    function buildForm() {
      var name = U.el("input", { class: "input", id: "cName", autocomplete: "name", placeholder: "Kwame Asante" });
      var email = U.el("input", { class: "input", id: "cEmail", type: "email", autocomplete: "email", placeholder: "you@example.com" });
      var facility = U.el("input", { class: "input", id: "cFacility", placeholder: "Ejisu Grain Store, 6 bays" });
      var topic = U.el("select", { class: "select", id: "cTopic" }, [
        "Install Sentry at my store", "A sensor or gateway has stopped reporting",
        "Question about thresholds and alerts", "Pricing and hardware list", "Something else"
      ].map(function (t) { return U.el("option", { value: t, text: t }); }));
      var message = U.el("textarea", { class: "textarea", id: "cMessage", placeholder: "Six bays of maize, usually held for two to three months. We lost about a tonne to mould last season and want to see it coming." });

      var submit = U.el("button", { class: "btn btn--block", type: "submit", text: "Send message" });
      var el = U.el("form", { novalidate: true }, [
        U.el("div", { class: "grid grid--2", style: "gap:16px" }, [
          field("cName", "Your name", name),
          field("cEmail", "Email", email)
        ]),
        U.el("div", { class: "grid grid--2", style: "gap:16px" }, [
          field("cFacility", "Store or facility", facility),
          field("cTopic", "What is this about?", topic)
        ]),
        field("cMessage", "Message", message),
        submit
      ]);

      function setErr(id, msg) {
        var e = el.querySelector("#" + id + "Err");
        var f = e ? e.closest(".field") : null;
        if (e) e.textContent = msg || "";
        if (f) f.classList.toggle("has-err", !!msg);
        return !msg;
      }

      function validate() {
        var ok = true;
        ok = setErr("cName", name.value.trim().length < 2 ? "Enter your name so we know who is asking." : "") && ok;
        ok = setErr("cEmail", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? "" : "Enter an email we can reply to.") && ok;
        ok = setErr("cMessage", message.value.trim().length < 12 ? "Tell us a little more — a sentence or two is plenty." : "") && ok;
        return ok;
      }
      [name, email, message].forEach(function (i) {
        i.addEventListener("blur", validate);
        i.addEventListener("input", function () { if (i.closest(".field").classList.contains("has-err")) validate(); });
      });

      el.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validate()) {
          UI.toast("Check the highlighted fields", "Three things are needed: your name, an email, and a message.", "alert");
          var first = el.querySelector(".has-err .input, .has-err .textarea");
          if (first) first.focus();
          return;
        }
        submit.disabled = true;
        submit.textContent = "Sending…";
        API.sendContact({
          name: name.value.trim(), email: email.value.trim(),
          facility: facility.value.trim(), topic: topic.value,
          message: message.value.trim(), at: new Date().toISOString()
        }).then(function (res) {
          el.innerHTML = "";
          el.appendChild(U.el("div", { class: "banner banner--ok" }, [
            U.el("span", { class: "banner__icon", html: ICON("check", 22) }),
            U.el("div", { class: "banner__body" }, [
              U.el("div", { class: "banner__title", text: "Message sent" }),
              U.el("p", { class: "banner__text",
                text: "Thanks " + name.value.trim().split(" ")[0] + ". We reply within one working day" +
                      (res && res.ref ? ", your reference is " + res.ref + "." : ".") }),
              U.el("div", { class: "banner__actions" }, [
                U.el("button", { class: "btn btn--sm btn--ghost", type: "button", text: "Send another",
                  onclick: function () {
                    var fresh = buildForm();
                    el.parentNode.replaceChild(fresh, el);
                    fresh.querySelector("#cName").focus();
                  } }),
                U.el("a", { class: "btn btn--sm", href: "#/dashboard", text: "Back to the dashboard" })
              ])
            ])
          ]));
          STORE.log("info", "Message sent to the operations desk — " + topic.value, "Contact form");
          UI.toast("Message sent", "We will reply within one working day.", "ok");
        }).catch(function () {
          submit.disabled = false;
          submit.textContent = "Send message";
          UI.toast("That did not send", "The operations desk did not respond. Call " + F.phone + " if it is urgent.", "alert");
        });
      });

      return el;
    }

    return function destroy() { };
  }

  w.PAGES = w.PAGES || {};
  w.PAGES.contact = { render: render, title: "Contact — Sentry", heroDark: true };
})(window);
