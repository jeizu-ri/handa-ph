# Handa PH

Philippines typhoon and **tropical cyclone wind signal (TCWS)** alerts as an installable PWA.

**Disclaimer:** This app mirrors third-party parsed data from public DOST-PAGASA bulletins. It is **not** official. Always confirm with [PAGASA Severe Weather Bulletin](https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin) before life-safety decisions.

## Features (MVP)

- **My signal** — wind signal for a saved Philippine location
- **Active cyclones** — latest bulletin headlines with links to PAGASA
- **Signals nationwide** — areas under TCWS #1–5
- **Track map** — storm forecast tracks in the Philippine area (bagyo.io)
- **PWA** — offline shell + cached API responses via service worker

## Quick start (frontend only)

```bash
cd handa-ph
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. API routes under `/api/*` are proxied in dev by Vite (see `vite.config.ts`).

## Data backends

### 1. BagyoAPI (signals & cyclones)

There is no official PAGASA JSON API. This project uses [BagyoAPI](https://github.com/edwardguevarra/bagyo-api) for `/v1/cyclones/active`, `/v1/signals/current`, and `/v1/signals/lookup`.

**Local (recommended for development):**

```bash
git clone https://github.com/edwardguevarra/bagyo-api.git
cd bagyo-api
docker compose up -d --build
```

Set in `.env`:

```
BAGYO_PAGASA_API_URL=http://localhost:3000
```

The seed data includes real archived bulletins so the UI works without live scraping.

### 2. bagyo.io Storms API (map tracks)

Get a free key at [bagyo.io/developers](https://bagyo.io/developers) and set:

```
BAGYO_STORMS_API_KEY=bgy_…
```

Without this key, the map tab shows a configuration message; other tabs still work if BagyoAPI is reachable.

## Deploy (Vercel)

1. Import the repo and set environment variables (`BAGYO_PAGASA_API_URL`, `BAGYO_STORMS_API_KEY`).
2. Deploy — static assets from Vite build; serverless handlers in `/api`.
3. Point `BAGYO_PAGASA_API_URL` at your hosted BagyoAPI instance (self-host on Fly/Railway/VPS per upstream docs).

```bash
npm run build
```

## Project layout

- `src/` — React UI, TanStack Query, MapLibre map
- `api/` — Vercel serverless proxies (hide storm API key, avoid CORS)
- `vite.config.ts` — Tailwind, PWA, dev API proxy

## License

MIT. PAGASA bulletin content is Philippine government public information; attribute DOST-PAGASA when displaying derived data.
