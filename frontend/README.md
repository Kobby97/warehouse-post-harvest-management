# Sentry — post-harvest loss management frontend

A four-screen operator console for a grain storage facility. Vanilla JavaScript, no build
step, no framework, no npm install. Open `index.html` and it runs.

**Screens:** Home · Storage · Controls · Dashboard · Contact
**Palette:** field green `#0B5A2B` · harvest gold `#E0A82E` · husk white `#FBFAF4`
**Type:** Bricolage Grotesque (display) · Public Sans (body) · IBM Plex Mono (readouts)

---

## 1. Running it

```
sentry/
├── index.html
├── README.md
└── assets/
    ├── css/styles.css
    └── js/
        ├── config.js      ← the only file you edit to attach a backend
        ├── utils.js       formatting, status logic, CSV export
        ├── icons.js       inline SVG icon set
        ├── mock.js        dummy data, shaped exactly like the real API
        ├── api.js         every network call, with mock fallback
        ├── store.js       central state, polling, websocket
        ├── charts.js      SVG charts + the silo gauge
        ├── components.js  toasts, modal, nav, carousel
        ├── router.js      hash routing
        ├── app.js         boot sequence
        └── pages/         home · storage · controls · dashboard · contact
```

Double-click `index.html`, or serve it:

```bash
python3 -m http.server 5173     # then open http://localhost:5173
```

Deploy by copying the folder to any static host (Netlify, Vercel, GitHub Pages, Nginx).

---

## 2. Attaching your backend

Open `assets/js/config.js` and set one line:

```js
API_BASE_URL: "http://192.168.137.1:4000/api",
```

That's it. Every screen switches to live data.

You can also do it without editing code: click the pill in the top-right of the header
(**Mock data / Live backend**) and enter the URL. It's saved in `localStorage`, which is
handy when your LAN IP changes between sessions.

**The pill tells you what you're looking at:**

| Pill | Meaning |
|---|---|
| 🟢 Live backend | Requests are succeeding |
| 🟡 Mock data | No URL set, or the server didn't answer — showing the dummy set |
| 🔴 Backend down | A URL is set but requests are failing |

Set `ALLOW_MOCK_FALLBACK: false` in production so real errors surface instead of being
papered over with sample data.

### CORS

Your API must allow the origin the page is served from. In Express:

```js
app.use(cors({ origin: "*" }));   // tighten this for production
```

---

## 3. The API contract

Endpoint paths live in `CONFIG.ENDPOINTS` — rename them there to match your routes rather
than changing any page code. Responses may be bare JSON or wrapped in `{ "data": … }`;
both are accepted.

### `GET /telemetry/latest`
```json
{ "at": 1755080000000, "siloId": "SILO-A", "temperature": 32.4, "humidity": 58.2,
  "moisture": 13.9, "weightKg": 9840, "co2": 1310, "gateway": "ESP32-A1", "online": true }
```

### `GET /telemetry/history?range=6h|12h|24h|7d`
Array, oldest first:
```json
[{ "at": 1755000000000, "temperature": 28.6, "humidity": 57.0,
   "moisture": 13.0, "weightKg": 9840, "co2": 900 }]
```

### `GET /silos`
```json
[{ "id": "SILO-A", "name": "Silo A — East bay", "crop": "Maize (Obatanpa)",
   "capacityKg": 12000, "weightKg": 9840, "temperature": 32.4, "humidity": 58.2,
   "moisture": 13.9, "co2": 1310, "gateway": "ESP32-A1",
   "lastSeen": 1755079996000, "image": "https://…" }]
```
`image` is optional — omit it and the bay card shows the Sentry placeholder.

### `GET /batches`
```json
[{ "id": "LOT-2607", "crop": "Maize", "variety": "Obatanpa", "silo": "SILO-A",
   "farmer": "Kwabena Antwi", "intakeDate": "2026-07-03T08:12:00Z", "weightKg": 4200,
   "intakeMoisture": 14.8, "moisture": 13.9, "lossPct": 4.1, "status": "at-risk" }]
```
`status` ∈ `storing` · `at-risk` · `dispatched` · `quarantine`
`POST /batches` receives the same shape. `POST /batches/:id/dispatch` takes no body.

### `GET /alerts`
```json
[{ "id": "ALR-081", "silo": "SILO-A", "severity": "critical",
   "title": "Silo A above temperature cap", "detail": "32.4 °C against a 30.0 °C cap.",
   "at": 1755076900000, "state": "active" }]
```
`severity` ∈ `critical` · `warning` · `info` — `state` ∈ `active` · `acknowledged` · `resolved`
`POST /alerts/:id/ack` and `/resolve` take no body.

### `GET /activity`
```json
[{ "id": "act_1", "level": "alert", "text": "Silo A temperature crossed the 30 °C cap",
   "source": "DHT22 · SILO-A", "at": 1755076900000 }]
```
`level` ∈ `ok` · `warn` · `alert` · `info`

### `GET /audit`
```json
[{ "id": "aud_1", "at": 1755076900000, "silo": "SILO-A", "sensor": "DHT22 temperature",
   "value": 32.4, "unit": "°C", "cap": 30.0, "outcome": "Buzzer triggered", "level": "alert" }]
```

### `GET /metrics/summary`
```json
{ "grainStoredKg": 29010, "lotsActive": 8, "lossToDateKg": 612, "lossToDatePct": 2.1,
  "valueAtRisk": 3917, "valueStored": 185664, "riskIndex": 68, "riskTrendPerDay": 1.6,
  "safeDays": 6, "uptimePct": 99.2, "actionsToday": 124, "alertsActive": 2,
  "recImplementedPct": 88, "recPendingPct": 15, "avgResponseSec": 406, "capacityUsedPct": 54 }
```

### `GET /actuators`
```json
[{ "id": "fan", "name": "Ventilation fan", "description": "Pulls warm air out of the head space.",
   "icon": "fan", "state": true, "pin": "GPIO 26" }]
```
`icon` ∈ `fan` `wind` `dehumid` `bell` `bulb` `truck` `power` `robot` `wrench` `route` `droplet`
`PATCH /actuators/:id` receives `{ "state": true }`.

### `GET /thresholds` · `PUT /thresholds`
```json
{ "tempMax": 30.0, "tempMin": 10.0, "humidityMax": 65.0, "humidityMin": 40.0,
  "moistureMax": 13.5, "co2Max": 1200 }
```

### `GET /recommendations`
```json
[{ "id": "REC-1", "type": "cooling", "title": "Run aeration on Silo A tonight",
   "body": "Silo A has held above 30 °C for 4 hours…",
   "impact": "Cuts spoilage risk by an estimated 18%", "action": "schedule", "icon": "wind" }]
```
`action` ∈ `apply` · `schedule` — `POST /recommendations/:id` receives
`{ "action": "apply" | "schedule" | "dismiss" }`.

### `POST /contact`
Receives `{ name, email, facility, topic, message, at }`.
Return `{ "received": true, "ref": "MSG-XYZ" }` and the reference is shown to the sender.

---

## 4. Realtime

Set `WS_URL` in `config.js`. `"auto"` derives it from `API_BASE_URL`
(`http://host/api` → `ws://host/ws`). The client reconnects with backoff and gives up
after eight attempts. Frames:

```json
{ "type": "telemetry", "payload": { …GET /telemetry/latest shape… } }
{ "type": "silos",     "payload": [ …GET /silos shape… ] }
{ "type": "alert",     "payload": { …one alert… } }
{ "type": "activity",  "payload": { …one activity entry… } }
{ "type": "actuator",  "payload": { "id": "fan", "state": true } }
{ "type": "metrics",   "payload": { …metrics shape… } }
```

Without a websocket the app polls `POLL_MS` (default 5s) and pauses in a background tab.

---

## 5. Auth

If your API needs a token, either set it in the connection-settings dialog or write it
yourself: `localStorage.setItem("sentry.token", JSON.stringify("eyJ…"))`.
It is sent as `Authorization: Bearer <token>`; change the scheme in `config.js`.

---

## 6. Things worth knowing

**Spoilage risk index** is computed client-side in `utils.js → riskIndex()` from
temperature, humidity and grain moisture, so it stays explainable. When your TinyML model
is ready, return `riskIndex` from `/metrics/summary` and use that instead — one line in
`dashboard.js → paintGauge()`.

**Loss valuation** uses `CONFIG.ECONOMICS.pricePerKg` (₵6.40/kg). Change it there and
every cedi figure on every screen updates.

**Images** are pulled from the Unsplash CDN and carry no watermark. Any image that fails
to load is swapped for an inline SVG placeholder, so a dead CDN never shows a broken icon.
Swap the URLs in `CONFIG.IMAGES` for your own photos when you have them.

**Keyboard shortcuts:** `H` home · `S` storage · `C` controls · `D` dashboard ·
`K` contact · `R` refresh · `Esc` close dialog.

**Accessibility:** skip link, visible focus rings, ARIA on the carousel, sortable table
headers reachable by keyboard, `prefers-reduced-motion` respected, works down to 360 px.
