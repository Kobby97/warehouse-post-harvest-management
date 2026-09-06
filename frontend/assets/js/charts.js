/* ============================================================
   SENTRY · charts.js — hand-rolled SVG. No chart library, so
   the store shed can load this over a slow connection.
   ============================================================ */
(function (w) {
  "use strict";
  var U = w.U;
  var NS = "http://www.w3.org/2000/svg";

  function svgEl(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* Catmull–Rom -> cubic bezier, so lines read as a trend not a zigzag. */
  function smoothPath(pts, tension) {
    if (pts.length < 2) return "";
    var t = tension === undefined ? 0.36 : tension;
    var d = "M" + pts[0][0] + "," + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += " C" + (p1[0] + (p2[0] - p0[0]) * t / 3) + "," + (p1[1] + (p2[1] - p0[1]) * t / 3) +
           " " + (p2[0] - (p3[0] - p1[0]) * t / 3) + "," + (p2[1] - (p3[1] - p1[1]) * t / 3) +
           " " + p2[0] + "," + p2[1];
    }
    return d;
  }

  /* ------------------------------------------------------------
     lineChart(mount, options)
     series: [{ key, label, color, dp, unit, cap }]
     data:   [{ at, <key>: value, … }]
     ------------------------------------------------------------ */
  function lineChart(mount, opts) {
    var data = opts.data || [];
    var series = opts.series || [];
    var W = 900, H = opts.height || 260;
    var pad = { t: 18, r: 16, b: 8, l: 16 };

    mount.innerHTML = "";
    mount.classList.add("chart__wrap");
    if (!data.length) {
      mount.appendChild(U.el("p", { class: "tbl__empty", text: "No readings for this window yet." }));
      return;
    }

    var vals = [];
    series.forEach(function (s) { data.forEach(function (d) { if (typeof d[s.key] === "number") vals.push(d[s.key]); }); });
    series.forEach(function (s) { if (typeof s.cap === "number") vals.push(s.cap); });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var span = (max - min) || 1;
    min -= span * 0.14; max += span * 0.14;

    var x = function (i) { return pad.l + (i / Math.max(1, data.length - 1)) * (W - pad.l - pad.r); };
    var y = function (v) { return pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b); };

    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img" });
    svg.setAttribute("aria-label", opts.ariaLabel || "Trend chart");

    /* horizontal guides */
    for (var g = 0; g <= 4; g++) {
      var gy = pad.t + (g / 4) * (H - pad.t - pad.b);
      svg.appendChild(svgEl("line", { x1: pad.l, x2: W - pad.r, y1: gy, y2: gy, class: "chart-grid" }));
    }

    var defs = svgEl("defs", {});
    series.forEach(function (s, si) {
      var pts = data.map(function (d, i) { return [x(i), y(d[s.key])]; });

      /* cap line */
      if (typeof s.cap === "number" && s.cap > min && s.cap < max) {
        svg.appendChild(svgEl("line", { x1: pad.l, x2: W - pad.r, y1: y(s.cap), y2: y(s.cap), class: "chart-cap" }));
        var capLbl = svgEl("text", { x: W - pad.r, y: y(s.cap) - 7, "text-anchor": "end",
          "font-family": "IBM Plex Mono, monospace", "font-size": "11", fill: "#B4291D" });
        capLbl.textContent = "cap " + s.cap + (s.unit || "");
        svg.appendChild(capLbl);
      }

      if (opts.area !== false && si === 0) {
        var gid = "grad_" + U.uid("g");
        var lg = svgEl("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 });
        lg.appendChild(svgEl("stop", { offset: "0", "stop-color": s.color, "stop-opacity": ".26" }));
        lg.appendChild(svgEl("stop", { offset: "1", "stop-color": s.color, "stop-opacity": "0" }));
        defs.appendChild(lg);
        svg.appendChild(svgEl("path", {
          d: smoothPath(pts) + " L" + x(data.length - 1) + "," + (H - pad.b) + " L" + x(0) + "," + (H - pad.b) + " Z",
          fill: "url(#" + gid + ")", stroke: "none"
        }));
      }

      svg.appendChild(svgEl("path", { d: smoothPath(pts), class: "chart-line", stroke: s.color, "vector-effect": "non-scaling-stroke" }));

      /* markers, thinned out so a 7-day series doesn't turn into beads */
      var every = Math.max(1, Math.ceil(data.length / 14));
      pts.forEach(function (p, i) {
        if (i % every !== 0 && i !== pts.length - 1) return;
        svg.appendChild(svgEl("circle", { cx: p[0], cy: p[1], r: 4.4, fill: s.markerFill || s.color, class: "chart-pt" }));
      });
    });
    svg.insertBefore(defs, svg.firstChild);

    /* hover readout */
    var cursor = svgEl("line", { x1: 0, x2: 0, y1: pad.t, y2: H - pad.b, stroke: "#0B5A2B", "stroke-width": 1.4, "stroke-dasharray": "3 4", opacity: 0 });
    svg.appendChild(cursor);
    var hit = svgEl("rect", { x: 0, y: 0, width: W, height: H, class: "chart-hit" });
    svg.appendChild(hit);

    var tip = U.el("div", { class: "chart__tip" });
    mount.appendChild(svg);
    mount.appendChild(tip);

    function move(clientX) {
      var box = svg.getBoundingClientRect();
      var rel = (clientX - box.left) / box.width * W;
      var i = Math.round((rel - pad.l) / (W - pad.l - pad.r) * (data.length - 1));
      i = U.clamp(i, 0, data.length - 1);
      var d = data[i];
      cursor.setAttribute("x1", x(i)); cursor.setAttribute("x2", x(i)); cursor.setAttribute("opacity", ".55");
      var lines = series.map(function (s) {
        return s.label + ": " + U.num(d[s.key], s.dp === undefined ? 1 : s.dp) + (s.unit || "");
      });
      tip.innerHTML = '<b>' + U.esc(new Date(d.at).toTimeString().slice(0, 5)) + '</b><br>' + U.esc(lines.join(" · ")).replace(/ · /g, "<br>");
      tip.style.left = (x(i) / W * box.width) + "px";
      tip.style.top = (y(d[series[0].key]) / H * box.height) + "px";
      tip.style.opacity = 1;
    }
    hit.addEventListener("mousemove", function (e) { move(e.clientX); });
    hit.addEventListener("touchmove", function (e) { if (e.touches[0]) move(e.touches[0].clientX); }, { passive: true });
    hit.addEventListener("mouseleave", function () { tip.style.opacity = 0; cursor.setAttribute("opacity", 0); });

    /* axis + legend */
    if (opts.axis !== false) {
      var f = function (d) { return new Date(d.at).toTimeString().slice(0, 5); };
      mount.appendChild(U.el("div", { class: "chart__axis" }, [
        U.el("span", { text: f(data[0]) }),
        U.el("span", { text: f(data[Math.floor(data.length / 2)]) }),
        U.el("span", { text: "now" })
      ]));
    }
    if (opts.legend !== false && series.length) {
      var leg = U.el("div", { class: "chart__legend" });
      series.forEach(function (s) {
        leg.appendChild(U.el("span", {}, [
          U.el("i", { class: "chart__key", style: "background:" + s.color }),
          document.createTextNode(s.label + (s.unit ? " (" + s.unit.trim() + ")" : ""))
        ]));
      });
      mount.appendChild(leg);
    }
  }

  /* ---------- sparkline for metric tiles ---------- */
  function sparkline(values, color, w_, h_) {
    var W = w_ || 96, H = h_ || 30;
    if (!values || values.length < 2) return document.createDocumentFragment();
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values), sp = (max - min) || 1;
    var pts = values.map(function (v, i) {
      return [i / (values.length - 1) * W, H - ((v - min) / sp) * (H - 4) - 2];
    });
    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, "aria-hidden": "true" });
    svg.appendChild(svgEl("path", {
      d: smoothPath(pts), fill: "none", stroke: color || "#0B5A2B",
      "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: ".85"
    }));
    return svg;
  }

  /* ------------------------------------------------------------
     SIGNATURE — siloGauge(mount, silo, thresholds)
     A cross-section of the bin. Grain rises with the load cell,
     the temperature band above it warms from green through gold
     to red, and the fill line carries the actual weight.
     ------------------------------------------------------------ */
  function siloGauge(mount, silo, T) {
    var fill = U.clamp(silo.capacityKg ? silo.weightKg / silo.capacityKg : 0, 0, 1);
    var tLevel = U.levelFor(silo.temperature, T.tempMax, T.tempMax - 2);
    var hLevel = U.levelFor(silo.humidity, T.humidityMax, T.humidityMax - 5);
    var worst = U.worstLevel([tLevel, hLevel]);
    var bandColor = { ok: "#CFE6D5", warn: "#F7E2B0", alert: "#F5C7C1" }[worst];
    var grainTop = { ok: "#E0A82E", warn: "#D89321", alert: "#C4761B" }[worst];
    var grainBot = { ok: "#B7801A", warn: "#AC7217", alert: "#95560F" }[worst];

    var W = 260, H = 320;
    var binX = 46, binW = 168, binTop = 86, binBot = 276;
    var innerH = binBot - binTop;
    var gh = innerH * fill;
    var gy = binBot - gh;

    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img" });
    svg.setAttribute("aria-label",
      "Storage bin " + silo.id + ": " + Math.round(fill * 100) + " percent full, " +
      silo.temperature + " degrees, " + U.LEVEL_WORD[worst].toLowerCase());

    var defs = svgEl("defs", {});
    var gid = "grain_" + U.uid("s");
    var lg = svgEl("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 });
    lg.appendChild(svgEl("stop", { offset: "0", "stop-color": grainTop }));
    lg.appendChild(svgEl("stop", { offset: "1", "stop-color": grainBot }));
    defs.appendChild(lg);
    var cid = "clip_" + U.uid("c");
    var cp = svgEl("clipPath", { id: cid });
    cp.appendChild(svgEl("rect", { x: binX, y: binTop, width: binW, height: innerH, rx: 6 }));
    defs.appendChild(cp);
    svg.appendChild(defs);

    /* head space — colour carries the condition */
    svg.appendChild(svgEl("rect", { x: binX, y: binTop, width: binW, height: innerH, rx: 6, fill: bandColor, class: "siloband" }));

    /* grain mass */
    var gGroup = svgEl("g", { "clip-path": "url(#" + cid + ")" });
    gGroup.appendChild(svgEl("rect", { x: binX, y: gy, width: binW, height: gh + 4, fill: "url(#" + gid + ")" }));
    /* heaped surface */
    gGroup.appendChild(svgEl("path", {
      d: "M" + binX + "," + gy + " q" + (binW * 0.25) + ",-13 " + (binW * 0.5) + ",0 q" + (binW * 0.25) + ",13 " + (binW * 0.5) + ",0 L" + (binX + binW) + "," + (gy + 12) + " L" + binX + "," + (gy + 12) + " Z",
      fill: grainTop
    }));
    /* grain texture */
    for (var i = 0; i < 26; i++) {
      var px = binX + 10 + Math.random() * (binW - 20);
      var py = gy + 16 + Math.random() * Math.max(2, gh - 20);
      if (py > binBot - 4) continue;
      gGroup.appendChild(svgEl("ellipse", { cx: px, cy: py, rx: 3.1, ry: 2.1, fill: "#fff", opacity: ".16" }));
    }
    svg.appendChild(gGroup);

    /* roof */
    svg.appendChild(svgEl("path", {
      d: "M" + (binX - 10) + "," + binTop + " L" + (binX + binW / 2) + "," + (binTop - 46) + " L" + (binX + binW + 10) + "," + binTop + " Z",
      fill: "#0B5A2B"
    }));
    svg.appendChild(svgEl("rect", { x: binX + binW / 2 - 9, y: binTop - 64, width: 18, height: 20, rx: 3, fill: "#063B1B" }));

    /* shell + ribs */
    svg.appendChild(svgEl("rect", { x: binX, y: binTop, width: binW, height: innerH, rx: 6, fill: "none", stroke: "#0B5A2B", "stroke-width": 3 }));
    [0.25, 0.5, 0.75].forEach(function (f) {
      var ly = binTop + innerH * f;
      svg.appendChild(svgEl("line", { x1: binX, x2: binX + binW, y1: ly, y2: ly, stroke: "#0B5A2B", "stroke-width": 1, opacity: ".22" }));
    });
    /* legs */
    svg.appendChild(svgEl("path", { d: "M" + (binX + 18) + "," + binBot + " l-8,18 M" + (binX + binW - 18) + "," + binBot + " l8,18", stroke: "#0B5A2B", "stroke-width": 4, "stroke-linecap": "round" }));

    /* fill marker */
    svg.appendChild(svgEl("line", { x1: binX + binW + 8, x2: binX + binW + 22, y1: gy, y2: gy, stroke: "#063B1B", "stroke-width": 2 }));
    var wt = svgEl("text", { x: binX + binW + 26, y: gy + 4, "font-family": "IBM Plex Mono, monospace", "font-size": "12", "font-weight": "600", fill: "#063B1B" });
    wt.textContent = Math.round(fill * 100) + "%";
    svg.appendChild(wt);

    /* sensor probe */
    svg.appendChild(svgEl("line", { x1: binX + binW / 2, x2: binX + binW / 2, y1: binTop + 8, y2: gy + 22, stroke: "#063B1B", "stroke-width": 2, opacity: ".5" }));
    svg.appendChild(svgEl("circle", { cx: binX + binW / 2, cy: gy + 22, r: 5, fill: worst === "alert" ? "#B4291D" : worst === "warn" ? "#E0A82E" : "#17713C" }));

    /* readout in the head space */
    var rt = svgEl("text", { x: binX + binW / 2, y: binTop + 30, "text-anchor": "middle",
      "font-family": "IBM Plex Mono, monospace", "font-size": "22", "font-weight": "600",
      fill: worst === "alert" ? "#B4291D" : "#063B1B", class: "silo-readout" });
    rt.textContent = silo.temperature + "\u00B0C";
    svg.appendChild(rt);
    var rh = svgEl("text", { x: binX + binW / 2, y: binTop + 48, "text-anchor": "middle",
      "font-family": "IBM Plex Mono, monospace", "font-size": "12", fill: "#3C5546" });
    rh.textContent = silo.humidity + "% RH";
    svg.appendChild(rh);

    /* label */
    var lt = svgEl("text", { x: W / 2, y: H - 6, "text-anchor": "middle",
      "font-family": "IBM Plex Mono, monospace", "font-size": "11", "letter-spacing": "2", fill: "#6C8377" });
    lt.textContent = silo.id;
    svg.appendChild(lt);

    mount.innerHTML = "";
    mount.appendChild(svg);
  }

  w.CHART = { lineChart: lineChart, sparkline: sparkline, siloGauge: siloGauge, smoothPath: smoothPath };
})(window);
