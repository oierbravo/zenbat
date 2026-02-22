# Zenbat – Project summary

**Zenbat** is an inventory and manufacturing (MRP) application. The repo is split into a **Node.js API server** and a **React frontend** (Vite), each runnable separately.

## Repository structure

| Path        | Description |
|------------|-------------|
| `server/`  | API server (Express). Routes, controllers, config, data path. |
| `client/`  | React SPA (Vite, React Router, Tailwind). Proxies API in dev. |
| `docs/`    | Documentation. See [index](index.md) for the full list. |
| `public/`  | Legacy AngularJS assets (optional). |
| `scripts/` | E2E test (Playwright), etc. |

## How to start

- **API only** (port 3000):  
  `npm run dev:server`  
  Or from `server/`: `npm start`

- **Frontend only** (port 5173, proxies API to 3000):  
  `npm run dev:client`

- **Both**:  
  `npm run dev`

Data is read from `server/data/` by default. To use another path:  
`ZENBAT_DATA_PATH=/path/to/data npm run dev:server`

## More details

- **Server**: [docs/server.md](server.md) – start, data dir, CORS, ports.
- **All docs**: [docs/index.md](index.md) – documentation index.
