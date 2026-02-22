# Zenbat – React Migration Plan

This document proposes a plan to replace the AngularJS frontend with a React SPA, **keeping the same Express backend and all existing API routes** as documented in [RESEARCH.md](./RESEARCH.md).

---

## 1. Goals

- **Replace** the AngularJS (public/) frontend with a React SPA.
- **Reuse** all backend routes and controllers; no API changes.
- **Preserve** structure and functionality described in RESEARCH.md (28 pages across 8 feature areas).
- **Integrate** the React build with the existing Express app (serve from `public/` or a dedicated build path).

---

## 2. Tech Stack Proposal

| Layer        | Choice              | Notes |
|-------------|---------------------|--------|
| Framework   | **React 18**        | Current LTS, concurrent features. |
| Build       | **Vite**            | Fast dev, simple config, easy proxy to Express. |
| Router      | **React Router v6** | Declarative routes, matches RESEARCH.md states. |
| Data / API  | **fetch** or **axios** + **React Query (TanStack Query)** | Caching, loading/error states, refetch. |
| State       | **React Query** + **Context** (or Zustand) | Server state in React Query; minimal global UI state if needed. |
| Forms       | **React Hook Form** + **Zod** (optional) | For signin, signup, pedidos-proveedores CRUD, import, etc. |
| UI base     | **Tailwind CSS** or keep existing CSS | Tailwind speeds up layout; optional component library (e.g. shadcn/ui, Radix). |
| i18n        | Optional later      | If the app stays Spanish-only, not required for v1. |

---

## 3. Project Layout

Two options:

### Option A – React app inside repo (recommended)

```
zenbat/
├── app/                    # unchanged Express backend
├── config/
├── public/                 # after migration: only static assets or replaced by React build
├── client/                 # NEW: React app
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes.tsx      # React Router config
│   │   ├── api/            # API client (base URL, fetch wrappers)
│   │   ├── components/     # shared (Layout, Header, Table, etc.)
│   │   ├── hooks/          # useHomeData, useComponentes, etc.
│   │   └── pages/          # one folder per RESEARCH “module”
│   │       ├── core/
│   │       ├── users/
│   │       ├── componentes/
│   │       ├── armarios/
│   │       ├── armario-generator/
│   │       ├── pedidos/
│   │       ├── pedidos-proveedores/
│   │       └── historial/
├── server.js
└── package.json            # root: backend only; or workspace root
```

- **Dev:** `npm run dev` in `client/` runs Vite with proxy to `http://localhost:3000` (Express).
- **Build:** `npm run build` in `client/` outputs to `dist/`. Express serves `dist/` for `/` and static assets (see §5).

### Option B – React app in `frontend/` and build into `public/`

Same structure as above but under `frontend/`. Build output is copied to `public/` (e.g. by script or Grunt), and Express keeps serving `public/` and the existing `core.index` can be changed to send `public/index.html` for SPA fallback.

---

## 4. Route & Page Mapping (from RESEARCH.md)

React Router routes and main API usage per page:

| # | Route | Page / Component | Main API calls |
|---|--------|-------------------|-----------------|
| **Core** |
| 1 | `/` | Home (dashboard) | `GET /get-home-data`, `GET /leyenda` |
| 2 | `/reload` | Reload | `GET /reload-cli` (trigger) |
| **Users** (optional for v1 if auth is disabled) |
| 3 | `/signin` | SignIn | `POST /auth/signin` |
| 4 | `/signup` | SignUp | `POST /auth/signup` |
| 5 | `/settings/profile` | Profile | User/settings API |
| 6 | `/settings/password` | Change password | `POST /users/password` |
| 7 | `/settings/accounts` | Social accounts | `DELETE /users/accounts` etc. |
| 8 | `/password/forgot` | Forgot password | `POST /auth/forgot` |
| 9 | `/password/reset/:token` | Reset password | `POST /auth/reset/:token` |
| 10 | `/password/reset/invalid` | Reset invalid | — |
| 11 | `/password/reset/success` | Reset success | — |
| **Componentes** |
| 12 | `/componentes` | List componentes | `GET /componentes` or `GET /stock` |
| 13 | `/componentes/:componenteId` | View componente | `GET /componentes/:componenteId` |
| 14 | `/stock` | Stock (list + actions) | `GET /componentes`, `GET /pedidos-proveedores`, `GET .../stock?qty=`, `POST /add-to-pedido-proveedor` |
| 15 | `/importar-componentes` | Import XLSX | `POST /import/archivo` (multipart) |
| 16 | `/export-componentes` | Export XLSX | `GET /export-componentes` (download) |
| 17 | `/componentes-reload` | Reload from file | `GET /componentes-reload` (or equivalent) |
| **Armarios** |
| 18 | `/armarios` | List armarios | `GET /armarios` |
| 19 | `/armarios/:armarioId` | View armario | `GET /armarios/:armarioId`, verificar, entregar, exportar |
| **Armario generator** |
| 20 | `/generar-armario` | Generator form | `POST /generar-armario`, then `GET /generar-armario/:nombreArchivo` (download) |
| **Pedidos (internal)** |
| 21 | `/pedidos` | List pedidos | `GET /pedidos` |
| 22 | `/pedidos/:pedidoId` | View pedido | `GET /pedidos/:pedidoId` (+ verificar/entregar via armarios) |
| **Pedidos proveedores** |
| 23 | `/pedidos-proveedores` | List | `GET /pedidos-proveedores`, `GET /pedidos-proveedores-ultimo` |
| 24 | `/pedidos-proveedores/create` | Create | `GET /proveedores`, `GET /almacenes`, `GET /pedidos-proveedores-ultimo`, `POST /pedidos-proveedores` |
| 25 | `/pedidos-proveedores/:id` | View | `GET /pedidos-proveedores/:id` |
| 26 | `/pedidos-proveedores/:id/edit` | Edit | `GET /pedidos-proveedores/:id`, `PUT /pedidos-proveedores/:id`, `GET .../completar` |
| **Historial** |
| 27 | `/historial` | List historial | `GET /historial` |

Exact URL paths (e.g. `/componentes-reload`) should match backend and RESEARCH.md; React Router only needs to map them to the right page components.

---

## 5. Backend Integration (no API changes)

- **Keep** all route files under `app/routes/` and all controllers as they are.
- **API base URL:** In development, Vite proxy forwards `/api` (or all non-asset requests) to Express; in production, same origin if the React app is served by Express.
- **Serving the SPA:**
  - **Option A:** Point Express static to `client/dist` for production and add a catch-all route that serves `client/dist/index.html` for `GET /` and any non-file route so React Router can handle client-side routes.
  - **Option B:** Build React into `public/`, keep serving `public/`; change `core.index` to send `public/index.html` and ensure 404s for unknown paths also return that file (SPA fallback).

No new backend routes are required; the React app only consumes existing ones.

---

## 6. API Client Layer

- **Single module** (e.g. `src/api/client.ts`): base `fetch` with `credentials: 'include'` if cookies/sessions are used, and a base URL from env (e.g. `import.meta.env.VITE_API_URL` or empty for same-origin).
- **Per-domain helpers** (optional): `getHomeData()`, `getComponentes()`, `getArmarios()`, `createPedidoProveedor()`, etc., each calling the correct method and path from RESEARCH.md.
- **File uploads:** Use `FormData` for `POST /import/archivo` and for `POST /generar-armario` if needed; downloads via `window.open` or `fetch` + blob for `GET /export-componentes`, `GET /generar-armario/:nombreArchivo`, `GET /armarios/:id/exportar`.

---

## 7. Phased Implementation

| Phase | Scope | Deliverable |
|-------|--------|-------------|
| **0** | Setup | Vite + React + React Router + Tailwind in `client/`, proxy to Express; layout + nav linking to placeholder pages. |
| **1** | Core | Home (dashboard) and Reload using `GET /get-home-data`, `GET /leyenda`, `GET /reload-cli`. |
| **2** | Componentes | List, view, stock, import (file upload), export (download), reload-from-file. |
| **3** | Armarios | List, view, verificar, entregar, exportar. |
| **4** | Armario generator | Form + POST + download XLSX. |
| **5** | Pedidos | List and view internal pedidos. |
| **6** | Pedidos proveedores | List, view, create, edit, completar. |
| **7** | Historial | List historial. |
| **8** | Users (optional) | Signin, signup, profile, password, forgot/reset if auth is enabled. |
| **9** | Polish | Error boundaries, loading states, accessibility, replace Angular in `public/` and retire old assets. |

You can swap order (e.g. do Pedidos before Armarios) depending on priority.

---

## 8. Summary

- **Backend:** Unchanged; same routes and controllers.
- **Frontend:** New React SPA in `client/` (or `frontend/`) with Vite, React Router, and an API layer that mirrors RESEARCH.md.
- **Integration:** Express serves the built React app (Option A or B) with SPA fallback so all 28 “states” work as client-side routes.
- **Rollout:** Implement by feature area (Core → Componentes → Armarios → …), then switch production to the React build and remove the Angular app from `public/`.

If you want, next step can be a minimal **Phase 0** (Vite + React + Router + one Core page calling `GET /get-home-data`) scaffold under `client/` and the exact Express changes to serve it.
