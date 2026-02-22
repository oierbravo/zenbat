# Zenbat API server

The **API server** is a standalone Node.js (Express) app in `server/`. It serves all Zenbat API routes. The React frontend runs separately (Vite dev server or any static host) and talks to this API.

## How to start

**From repo root:**

```bash
npm run dev:server
```

Starts the API on **port 3000** (or `PORT` env var).

**From the server package:**

```bash
cd server
npm start
```

Same as `node server.js` inside `server/`.

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

- **3000** – API server (default).
- Frontend in development runs on **5173** and proxies API requests to 3000 (see `client/vite.config.ts`).

## See also

- [Summary](SUMMARY.md) – Project overview and start commands.
- [Documentation index](index.md) – All docs.
