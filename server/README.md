# Zenbat API server

Standalone Node.js API server. Serves all Zenbat API routes; the React frontend runs separately (Vite dev server or any static host).

## Run

From repo root:

- `npm run dev:server` – start API only (port 3000)
- `npm run dev:client` – start frontend only (port 5173, proxies API to 3000)
- `npm run dev` – start both (server in background, then client)

From this directory: `npm start` (same as `node server.js`).

## Data directory

By default the API uses `server/data/`. To use data at the repo root instead, set:

```bash
ZENBAT_DATA_PATH=../data npm run dev:server
```

Or use an absolute path. You can also symlink: `ln -s ../data server/data`.

## CORS

CORS is enabled so the frontend (e.g. `http://localhost:5173`) can call the API on a different origin.
