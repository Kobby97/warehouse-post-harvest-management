/* ============================================================
   SENTRY · icons.js — inline SVG, no external icon library
   Usage: ICON("fan", 22)  ->  svg markup string
   ============================================================ */
(function (w) {
  "use strict";
  var P = {
    thermometer: '<path d="M14 14.76V4a2 2 0 0 0-4 0v10.76a4.5 4.5 0 1 0 4 0Z"/>',
    droplet:     '<path d="M12 2.7 6.8 8.2a7.4 7.4 0 1 0 10.4 0Z"/>',
    scale:       '<path d="M12 3v18M7 21h10M5 7h14M5 7 2 14h6zm14 0 3 7h-6z"/><path d="M2 14a4 4 0 0 0 6 0M16 14a4 4 0 0 0 6 0"/>',
    gauge:       '<path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="m13.4 10.6 4.6-4.6"/><path d="M20.5 16.5a9.5 9.5 0 1 0-17 0"/>',
    shield:      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
    sparkles:    '<path d="m12 3 1.9 4.9L19 9.8l-5.1 1.9L12 17l-1.9-5.3L5 9.8l5.1-1.9Z"/><path d="M19 15l.9 2.3L22 18l-2.1.8L19 21l-.9-2.2L16 18l2.1-.7Z"/>',
    bell:        '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    activity:    '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    clock:       '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.9"/>',
    check:       '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-4.9"/>',
    checkPlain:  '<path d="m4.5 12.5 5 5 10-11"/>',
    warn:        '<path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4.5M12 17.2h.01"/>',
    info:        '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4.5M12 8h.01"/>',
    power:       '<path d="M12 3v9"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/>',
    robot:       '<rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 8V4.5M9.5 4.5h5"/><path d="M8.5 13.5h.01M15.5 13.5h.01"/><path d="M9.5 17h5"/>',
    fan:         '<path d="M12 12a4 4 0 0 0 4-4c0-3-2-4-4-4s-1 2.5-1 4 .5 4 1 4Z"/><path d="M12 12a4 4 0 0 1-4 4c-3 0-4-2-4-4s2.5-1 4-1 4 .5 4 1Z"/><path d="M12 12a4 4 0 0 0 4 4c3 0 4-2 4-4s-2.5-1-4-1-4 .5-4 1Z"/><path d="M12 12a4 4 0 0 1-4-4c0-3 2-4 4-4"/>',
    wind:        '<path d="M12.8 4.5A2 2 0 1 1 14 8H2"/><path d="M17.6 17.5A2 2 0 1 0 19 14H2"/><path d="M6 6.5A2 2 0 1 1 7.5 10"/>',
    dehumid:     '<path d="M12 2.7 6.8 8.2a7.4 7.4 0 1 0 10.4 0Z"/><path d="M9 14h6"/>',
    bulb:        '<path d="M9 18h6M10 22h4"/><path d="M15.1 14.5a5.5 5.5 0 1 0-6.2 0c.6.5 1.1 1.4 1.1 2.2h4c0-.8.5-1.7 1.1-2.2Z"/>',
    wrench:      '<path d="M14.2 6.3a4.5 4.5 0 0 0 5.9 5.9l-8 8a3 3 0 0 1-4.3-4.3Z"/>',
    route:       '<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h5a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h3"/>',
    search:      '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    download:    '<path d="M12 3v12"/><path d="m7.5 11 4.5 4.5 4.5-4.5"/><path d="M4 20h16"/>',
    plus:        '<path d="M12 5v14M5 12h14"/>',
    refresh:     '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>',
    truck:       '<path d="M2 7h11v10H2z"/><path d="M13 10h4l3 3v4h-7z"/><circle cx="6.5" cy="18.5" r="1.8"/><circle cx="17.5" cy="18.5" r="1.8"/>',
    silo:        '<path d="M6 9h12v12H6z"/><path d="m6 9 6-6 6 6"/><path d="M6 13h12M6 17h12"/>',
    home:        '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V13h6v9"/>',
    phone:       '<path d="M21.5 16.9v2.6a2 2 0 0 1-2.2 2 19.6 19.6 0 0 1-8.5-3 19.3 19.3 0 0 1-6-6 19.6 19.6 0 0 1-3-8.6 2 2 0 0 1 2-2.2h2.6a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1l-1 1a16 16 0 0 0 6 6l1-1a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>',
    mail:        '<rect x="2" y="4.5" width="20" height="15" rx="2"/><path d="m2.5 6.5 9.5 7 9.5-7"/>',
    pin:         '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.8"/>',
    leaf:        '<path d="M11 20A7 7 0 0 1 4 13c0-6 6-10 16-10 0 10-4 16-10 16Z"/><path d="M4 21c3-6 7-9 11-11"/>',
    trend:       '<path d="M22 7 13.5 15.5l-4-4L2 19"/><path d="M16 7h6v6"/>',
    chart:       '<path d="M3 3v18h18"/><path d="M7 15v-4M12 17V7M17 15v-6"/>',
    settings:    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
    close:       '<path d="M6 6l12 12M18 6 6 18"/>',
    arrowRight:  '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    arrowLeft:   '<path d="M20 12H5"/><path d="m11 6-6 6 6 6"/>',
    calendar:    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    bug:         '<path d="M8 4.5 9.5 6M16 4.5 14.5 6"/><rect x="7.5" y="6" width="9" height="13" rx="4.5"/><path d="M3 11h4.5M16.5 11H21M3.6 16.5 7.5 15M20.4 16.5 16.5 15M4.5 6.5 7.5 8M19.5 6.5 16.5 8"/>',
    wifi:        '<path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><path d="M12 19.5h.01"/><path d="M1.5 9a15 15 0 0 1 21 0"/>'
  };

  function ICON(name, size, extra) {
    var d = P[name] || P.info, s = size || 20;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (extra ? ' ' + extra : '') + '>' + d + '</svg>';
  }
  function ICONEL(name, size) {
    var span = document.createElement("span");
    span.style.display = "inline-flex";
    span.innerHTML = ICON(name, size);
    return span.firstChild;
  }
  w.ICON = ICON; w.ICONEL = ICONEL; w.ICON_PATHS = P;
})(window);
