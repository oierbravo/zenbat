# Zenbat API server

Node.js API server. Can run in three modes (env **`ZENBAT_FRONTEND`**):

- **standalone** (default) – API only; frontend runs separately (e.g. Vite).
- **angular** – Serves Angular app from `public/` and the API.
- **react** – Serves built React app from `client/dist/` and the API.

## Run

From repo root:

- `npm run dev:server` – API only (port 3000)
- `npm run start:angular` – API + Angular (serves `public/`)
- `npm run start:react` – API + React (serves `client/dist/`; run `npm run build` first)
- `npm run dev:client` – frontend only (port 5173, proxies API to 3000)
- `npm run dev` – API in background + client (standalone + Vite)

From this directory: `npm start` (default standalone). Use `ZENBAT_FRONTEND=angular` or `ZENBAT_FRONTEND=react` to serve a frontend.

## Data directory

By default the API uses `server/data/`. To use data at the repo root instead, set:

```bash
ZENBAT_DATA_PATH=../data npm run dev:server
```

Or use an absolute path. You can also symlink: `ln -s ../data server/data`.

## CORS

CORS is enabled so the frontend (e.g. `http://localhost:5173`) can call the API on a different origin.
