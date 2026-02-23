# Zenbat – Project summary

**Zenbat** is an inventory and manufacturing (MRP) application. The repo has a **Node.js API server** and two frontends: a **React app** (Vite, in `client/`) and a **legacy AngularJS app** (in `public/`). The server can run standalone (API only), with Angular, or with React.

## Repository structure

| Path        | Description |
|------------|-------------|
| `server/`  | API server (Express). Routes, controllers, config, data path. |
| `client/`  | React SPA (Vite, React Router, Tailwind). Proxies API in dev. |
| `public/`  | Legacy AngularJS app (used when `ZENBAT_FRONTEND=angular`). |
| `docs/`    | Documentation. See [index](index.md) for the full list. |
| `scripts/` | E2E test (Playwright), etc. |
| `bin/`     | **zenbat** CLI entry point. |
| `lib/`     | Extraction logic (e.g. armario PDF). |

## How to start

- **API only** (port 3000, default):  
  `npm run dev:server`  
  Or from `server/`: `npm start`

- **Server + Angular** (serves `public/` and API on same port):  
  `npm run start:angular` or `ZENBAT_FRONTEND=angular npm run dev:server`

- **Server + React** (serves `client/dist/` and API; run `npm run build` first):  
  `npm run start:react` or `ZENBAT_FRONTEND=react npm run dev:server`

- **Frontend only** (port 5173, proxies API to 3000):  
  `npm run dev:client`

- **API + React dev** (API in background, Vite client):  
  `npm run dev`

Data is read from `server/data/` by default. To use another path:  
`ZENBAT_DATA_PATH=/path/to/data npm run dev:server`

## CLI (zenbat)

From the project root you can run:

```bash
npm run zenbat -- generate armario <input.pdf> -o <output> [--xlsx] [--column-map <path>]
```
Or: `npx zenbat generate armario ...` or `node bin/zenbat.mjs generate armario ...`

This extracts the component list from an armario PDF and writes JSON, CSV, Markdown, and optionally XLSX. See [docs/cli.md](cli.md) for full usage.

## More details

- **Server**: [docs/server.md](server.md) – start, data dir, CORS, ports.
- **All docs**: [docs/index.md](index.md) – documentation index.
