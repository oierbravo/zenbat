# Zenbat API server

The **API server** is a Node.js (Express) app in `server/`. It can run in three modes:

- **Standalone** (default) – API only; no frontend served. Use when the frontend runs elsewhere (e.g. Vite dev server).
- **Server + Angular** – Serves the legacy Angular app from `public/` and the API.
- **Server + React** – Serves the built React app from `client/dist/` and the API (build with `npm run build` first).

Set the mode with the **`ZENBAT_FRONTEND`** environment variable: `standalone`, `angular`, or `react`. Default is `standalone`.

## How to start

**From repo root:**

```bash
# API only (default)
npm run dev:server

# API + Angular (serves public/)
ZENBAT_FRONTEND=angular npm run dev:server
# or
npm run start:angular

# API + React (serves client/dist/; run npm run build first)
ZENBAT_FRONTEND=react npm run dev:server
# or
npm run start:react
```

Starts the server on **port 3000** (or `PORT` env var). In **angular** or **react** mode, the same port serves both the API and the frontend.

**From the server package:**

```bash
cd server
npm start
# or with frontend: ZENBAT_FRONTEND=react npm start
```

Same as `node server.js` inside `server/`.

## Environment variables

| Variable | Values | Description |
|----------|--------|-------------|
| `ZENBAT_FRONTEND` | `standalone` (default), `angular`, `react` | Which frontend to serve with the API. `standalone` = API only. |
| `ZENBAT_DATA_PATH` | Path string | Data directory (default: `server/data/` when run from `server/`). |
| `PORT` | Number | Server port (default: 3000 in development, 80 in production). |
| `NODE_ENV` | `development`, `production` | Environment (affects config and port default). |

## Data directory

- By default the server reads data from **`server/data/`** (relative to the `server/` package).
- To use another path (e.g. repo root `data/`):

  ```bash
  ZENBAT_DATA_PATH=../data npm run dev:server
  ```

  Or an absolute path: `ZENBAT_DATA_PATH=/path/to/data npm run dev:server`.

- You can also symlink: `ln -s ../data server/data`.

Required data includes XLSX files and DB files as defined in `server/zenbat.config.js` (e.g. `productos.xlsx`, `pedidos.xlsx`, `proveedores.xlsx`, and `data/db/`).

## CORS

CORS is enabled so the frontend on another origin (e.g. `http://localhost:5173`) can call the API. Config: `cors({ origin: true, credentials: true })` in `server/config/express.js`.

## Ports

- **3000** – API server (default). In **angular** or **react** mode, the same port serves both API and frontend.
- In **standalone** mode, the frontend in development runs on **5173** and proxies API requests to 3000 (see `client/vite.config.ts`).

## See also

- [Summary](SUMMARY.md) – Project overview and start commands.
- [Documentation index](index.md) – All docs.
