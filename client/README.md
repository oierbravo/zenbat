# Zenbat – React client

React SPA that replaces the AngularJS frontend. Uses the same Express backend and API routes.

## Setup

```bash
npm install
```

## Development

1. Start the **Express backend** (from repo root):
   ```bash
   npm start
   # or: node server.js
   ```
   Backend runs on http://localhost:3000 (or `PORT` from config).

2. Start the **Vite dev server** (from this folder):
   ```bash
   npm run dev
   ```
   React app runs on http://localhost:5173. API calls are proxied to the backend.

## Build (production)

```bash
npm run build
```

Output is in `dist/`. When `client/dist` exists, Express serves the React app and uses it for `/` and SPA fallback for client-side routes.

## Structure

- `src/api/` – API client and types
- `src/components/` – shared layout, ErrorBoundary, UI
- `src/pages/` – page components by module (core, componentes, armarios, armario-generator, pedidos, pedidos-proveedores, historial)
- See [REACT-MIGRATION-PLAN.md](../REACT-MIGRATION-PLAN.md) for route and API mapping.

When `client/dist` exists, Express serves the React app first; the legacy Angular app in `public/` is not used for the SPA entry.
