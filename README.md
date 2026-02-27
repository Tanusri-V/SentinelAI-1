# Sentinel — Identity Theft Detection

> Hackathon Challenge #9 · Domain: Digital Fraud & Security Tools

Enterprise-grade web dashboard for anomaly-based identity theft detection from login activity datasets. Built with React 19, TypeScript, Vite, and Recharts. UI inspired by Palantir Foundry's operational intelligence platforms.

## Pages

| Route | Purpose |
|-------------|-----------------------------------------------|
| `/` | Landing page — project overview & feature cards |
| `/dashboard`| Analytics dashboard — CSV upload, KPIs, 6 charts |
| `/alerts` | Alert center — severity-filtered risk alerts |
| `/model` | Model logic — detection methodology & scoring weights |

## Features

- **CSV Dataset Ingestion** — drag-and-drop or file-browse with flexible column aliases.
- **Anomaly Detection Model** — weighted multi-signal scoring engine (6 behavioral features).
- **Risk Alert Generation** — severity classification (`low`, `medium`, `high`) with ranked alerts.
- **Behavior Trend Visualization** — interactive area / line / bar / pie charts.
- **Premium Dark UI** — glass morphism panels, grid overlays, ambient glow, sidebar navigation.
- **Code-Split Routes** — lazy-loaded pages for optimal bundle performance.

## Detection Logic

Each login is scored on a 0‑100 scale using weighted anomaly factors:

| Signal | Weight | Description |
|---------------------|--------|----------------------------------------------|
| Impossible Travel | 30 | Velocity between consecutive logins > 800 km/h |
| New Location | 26 | Location not previously seen for that user |
| New Device | 24 | Device not previously seen for that user |
| Frequency Anomaly | 22 | Daily login count z-score > 1.5 |
| Failed Login | 18 | Unsuccessful authentication attempt |
| Off-Hours Activity | 15 | Login outside 06:00‑22:00 local time |

Severity thresholds: **low** < 45 · **medium** 45‑69 · **high** ≥ 70

## Required CSV Columns

Minimum: `timestamp`, `userId`

Optional (recommended): `location`, `device`, `loginStatus`, `ipAddress`

Aliases are supported — e.g. `user` / `username` for `userId`, `time` / `datetime` for `timestamp`.

## Run Locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npx serve dist   # or any static server
```

## Demo Dataset

Click **Load Demo Dataset** on the Dashboard page to instantly ingest `public/sample-login-activity.csv` (75 rows, 7 users).

## Tech Stack

React 19 · TypeScript 5.9 · Vite 7 · Recharts · React Router · PapaParse
