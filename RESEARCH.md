# Zenbat – Frontend & Backend Research

This document summarizes the frontend pages (AngularJS), the data they need, and the backend routes (Express) and their purpose. The application is a MEAN-style stack: **Zenbat** (inventory and manufacturing / MRP).

---

## 1. Frontend Analysis

The frontend is an **AngularJS** SPA using **UI-Router**. The main app module is `zenbat` (`public/config.js`). Registered feature modules: `core`, `users`, `proveedores`, `pedidos`, `pedidos-proveedores`, `historial`, `componentes`, `armarios`, `armario-generator`, `alertas`.

### 1.1 Page Count Summary

| Module              | # States | Purpose area                    |
|---------------------|----------|---------------------------------|
| core                | 2        | Home, reload                    |
| users               | 10       | Auth, profile, password         |
| componentes         | 6        | Components, stock, import/export|
| armarios            | 2        | Armarios list & detail         |
| armario-generator   | 1        | Generate armario XLSX           |
| pedidos             | 2        | Internal orders list & detail   |
| pedidos-proveedores | 4        | Supplier orders CRUD            |
| historial           | 1        | History log                     |
| **Total**           | **28**   |                                 |

(Excluding shared/utility views like header; counting each UI-router state as one “page”.)

---

### 1.2 Pages and Data Needed (by module)

#### Core

| State   | URL    | Template                          | Purpose | Data needed |
|---------|--------|-----------------------------------|--------|-------------|
| `home`  | `/`    | `home.client.view.html`           | Dashboard: orders missing components, component count, pending supplier orders, legend/notes. | **GET** `/get-home-data` → `pedidosFaltan`, `numComponentes`, `pedidosProveedoresPendientes`, `proximos`. **GET** `/leyenda` → `leyenda`. |
| `reload`| `/reload` | `reload-all.client.view.html`  | Reload data from files (re-read config/files). | Depends on reload action (e.g. `/reload-cli`); page may just trigger reload. |

---

#### Users

| State           | URL                    | Template                         | Purpose | Data needed |
|-----------------|------------------------|----------------------------------|--------|-------------|
| `profile`       | `/settings/profile`    | `edit-profile.client.view.html`  | Edit user profile. | User profile (from auth/settings API). |
| `password`      | `/settings/password`   | `change-password.client.view.html` | Change password. | — |
| `accounts`      | `/settings/accounts`   | `social-accounts.client.view.html` | Social accounts. | Linked accounts. |
| `signup`        | `/signup`              | `signup.client.view.html`        | Register. | — |
| `signin`        | `/signin`              | `signin.client.view.html`        | Login. | — |
| `forgot`        | `/password/forgot`     | `forgot-password.client.view.html` | Request password reset. | — |
| `reset-invalid` | `/password/reset/invalid` | `reset-password-invalid.client.view.html` | Invalid reset token. | — |
| `reset-success` | `/password/reset/success` | `reset-password-success.client.view.html` | Reset success. | — |
| `reset`         | `/password/reset/:token` | `reset-password.client.view.html` | Set new password. | Token from URL. |

*Note: Users module routes exist in the frontend; corresponding backend auth routes are not listed in the server route files inspected (may live elsewhere or be disabled).*

---

#### Componentes

| State                  | URL                    | Template                           | Purpose | Data needed |
|------------------------|------------------------|------------------------------------|--------|-------------|
| `listComponentes`     | `/componentes`         | `list-componentes.client.view.html`| List all components. | **GET** `/componentes` (or `/stock`) → list of componentes. |
| `viewComponente`      | `/componentes/:componenteId` | `view-componente.client.view.html` | Single component detail. | **GET** `/componentes/:componenteId` → one componente. |
| `stock`               | `/stock`               | `list-stock.client.view.html`      | Stock view: list + stock actions (add to supplier order, adjust stock). | **GET** `/componentes` or `/stock` → componentes; modal uses **GET** `/pedidos-proveedores` for “add to pedido”; stock change → **GET** `/componentes/:componenteId/stock?qty=...`; add to pedido → **POST** `/add-to-pedido-proveedor`. |
| `importar-componentes`| `/importar-componentes` | `importar-componentes.client.view.html` | Import components from XLSX (update quantities). | **POST** `/import/archivo` (multipart file). |
| `exportComponentes`   | `/export-componentes` | `list-componente.client.view.html` | Export components to XLSX. | Page may list components; actual file from **GET** `/export-componentes` (server returns XLSX). |
| `componentes-reload`  | `/componentes-reload` | `reload-from-file.client.view.html` | Reload components from file. | **GET** `componentes-reload` (via Componentes service) → triggers reload. |

---

#### Armarios

| State          | URL                  | Template                    | Purpose | Data needed |
|----------------|----------------------|-----------------------------|--------|-------------|
| `list-armarios`| `/armarios`          | `list-armarios.client.view.html` | List armarios (from folder/XLSX). | **GET** `/armarios` → list of armarios. |
| `view-armario` | `/armarios/:armarioId` | `view-armario.client.view.html` | Single armario detail (verify, deliver, export). | **GET** `/armarios/:armarioId`; verify **GET** `/armarios/:armarioId/verificar`; deliver **GET** `/armarios/:armarioId/entregar`; export **GET** `/armarios/:armarioId/exportar`. |

---

#### Armario generator

| State             | URL               | Template                     | Purpose | Data needed |
|-------------------|-------------------|------------------------------|--------|-------------|
| `generar-armario` | `/generar-armario`| `generator-form.client.view.html` | Build armario from pasted lines; generate XLSX with prices from componentes. | User input (paste); **POST** `/generar-armario` (body: `nombreArchivo`, `componentes`); then **GET** `/generar-armario/:nombreArchivo` to download XLSX (server enriches with price/supplier from DB). |

---

#### Pedidos (internal orders / armario orders)

| State        | URL                  | Template                     | Purpose | Data needed |
|--------------|----------------------|------------------------------|--------|-------------|
| `listPedidos`| `/pedidos`           | `list-pedidos.client.view.html` | List internal pedidos. | **GET** `/pedidos` → list of pedidos. |
| `viewPedido` | `/pedidos/:pedidoId` | `view-pedido.client.view.html`  | Single pedido (verify stock, deliver). | **GET** `/pedidos/:pedidoId`; Armarios.verificar for stock check; Armarios.entregar for deliver. |

---

#### Pedidos a proveedores (supplier orders)

| State                      | URL                                | Template                           | Purpose | Data needed |
|----------------------------|------------------------------------|------------------------------------|--------|-------------|
| `list-pedidos-proveedores`| `/pedidos-proveedores`             | `list-pedidos-proveedores.client.view.html` | List supplier orders. | **GET** `/pedidos-proveedores`; **GET** `/pedidos-proveedores-ultimo` for next order number. |
| `view-pedido-proveedores`  | `/pedidos-proveedores/:pedidoProveedorId` | `view-pedido-proveedores.client.view.html` | View one supplier order. | **GET** `/pedidos-proveedores/:pedidoProveedoresId`. |
| `create-pedido-proveedores`| `/pedidos-proveedores/create`      | `create-pedido-proveedores.client.view.html` | Create supplier order. | **GET** `/proveedores`, **GET** `/almacenes`, **GET** `/pedidos-proveedores-ultimo`; **POST** `/pedidos-proveedores` to create. |
| `edit-pedido-proveedores`  | `/pedidos-proveedores/:pedidoProveedorId/edit` | `update-pedido-proveedores.client.view.html` | Edit supplier order. | **GET** `/pedidos-proveedores/:pedidoProveedoresId`; **PUT** `/pedidos-proveedores/:pedidoProveedoresId`; complete **GET** `.../completar`. |

---

#### Historial

| State      | URL         | Template                   | Purpose | Data needed |
|------------|-------------|----------------------------|--------|-------------|
| `historial`| `/historial`| `list-historial.client.view.html` | List history/audit log. | **GET** `/historial` → historial entries. |

---

## 2. Backend Routes

Backend is **Express**; routes are registered in `config/express.js`. Below: method, path, and purpose.

### 2.1 Core (`app/routes/core.server.routes.js`)

| Method | Path              | Purpose |
|--------|-------------------|---------|
| GET    | `/`               | Serve main app (index). |
| GET    | `/reload-cli`     | Reload CLI / re-read files (database.controller). |
| GET    | `/get-home-data`  | Dashboard data: pedidos con faltantes, num componentes, pedidos proveedores pendientes, próximos. |
| GET    | `/leyenda`        | Legend/notes content (e.g. markdown or HTML). |

---

### 2.2 Armarios (`app/routes/armarios.server.routes.js`)

| Method | Path                           | Purpose |
|--------|---------------------------------|---------|
| GET    | `/armarios`                     | List armarios (from configured folder / XLSX). |
| GET    | `/armarios/:armarioId`          | Get one armario. |
| GET    | `/armarios/:armarioId/verificar`| Verify armario (stock check). |
| GET    | `/armarios/:armarioId/entregar`  | Mark armario as delivered. |
| GET    | `/armarios/:armarioId/exportar`  | Export armario to XLSX. |

---

### 2.3 Armario generator (`app/routes/armario-generator.server.routes.js`)

| Method | Path                            | Purpose |
|--------|----------------------------------|---------|
| POST   | `/generar-armario`               | Accept list of componentes + nombreArchivo; store in cache; redirect to download. |
| GET    | `/generar-armario/:nombreArchivo`| Return generated XLSX (enriched with price/supplier from componentes DB). |

---

### 2.4 Componentes (`app/routes/componentes.server.routes.js`)

| Method | Path                          | Purpose |
|--------|-------------------------------|---------|
| GET    | `/stock`                      | List componentes (same as list). |
| GET    | `/componentes`                | List componentes. |
| GET    | `/componentes/:componenteId`  | Get one componente. |
| GET    | `/componentes/:componenteId/stock` | Get/update stock for componente (qty param). |
| GET    | `/importar-componentes`       | Serve import view or trigger import (controller: importarComponentes). |
| GET    | `/export-componentes`        | Export all componentes to XLSX (server-generated file). |

*Param middleware:* `componenteId` → `database.getComponenteById`.

---

### 2.5 Pedidos (`app/routes/pedidos.server.routes.js`)

| Method | Path                  | Purpose |
|--------|-----------------------|---------|
| GET    | `/pedidos`            | List pedidos (internal orders). |
| GET    | `/pedidos/:pedidoId`  | Get one pedido. |

*Param middleware:* `pedidoId` → `database.getPedidoById`.

---

### 2.6 Pedidos proveedores (`app/routes/pedidos-proveedores.server.routes.js`)

| Method | Path                                          | Purpose |
|--------|------------------------------------------------|---------|
| GET    | `/pedidos-proveedores`                         | List supplier orders. |
| POST   | `/pedidos-proveedores`                         | Create supplier order. |
| GET    | `/pedidos-proveedores/:pedidoProveedoresId`    | Get one supplier order. |
| PUT    | `/pedidos-proveedores/:pedidoProveedoresId`    | Update supplier order (database controller). |
| DELETE | `/pedidos-proveedores/:pedidoProveedoresId`    | Delete supplier order. |
| GET    | `/pedidos-proveedores/:pedidoProveedoresId/completar` | Mark order as completed. |
| GET    | `/pedidos-proveedores-ultimo`                  | Get last order number (for next nPedido). |
| GET    | `/pedidos-proveedores-existe/:pedidoProveedoresExistsId` | Check if order number exists. |
| POST   | `/add-to-pedido-proveedor`                     | Add component line to a supplier order. |

*Param middleware:* `pedidoProveedoresId`, `pedidoProveedoresExistsId`.

---

### 2.7 Proveedores (`app/routes/proveedores.server.routes.js`)

| Method | Path                    | Purpose |
|--------|-------------------------|---------|
| GET    | `/proveedores`          | List proveedores (suppliers). |
| GET    | `/proveedores/:proveedorId` | Get one proveedor. |
| GET    | `/almacenes`            | List almacenes (warehouses). |
| GET    | `/almacenes/:almacenId`  | Get one almacen. |

*Param middleware:* `proveedorId`, `almacenId`.

---

### 2.8 Historial (`app/routes/historial.server.routes.js`)

| Method | Path        | Purpose |
|--------|-------------|---------|
| GET    | `/historial`| Return history/audit log (database.getHistorial). |

---

### 2.9 File upload / import (`app/routes/file-upload-importer.server.routes.js`)

| Method | Path             | Purpose |
|--------|------------------|---------|
| POST   | `/import/archivo`| Multipart upload of XLSX; update componente quantities by codigo/cantidadReal; then run calculos. |

---

## 3. Summary

- **Frontend:** 28 UI-router states across 8 feature modules (core, users, componentes, armarios, armario-generator, pedidos, pedidos-proveedores, historial). Each page’s data sources are listed above (REST endpoints and, where relevant, POST/GET for file operations).
- **Backend:** 9 route files defining ~35 distinct endpoints for app index, dashboard, reload, armarios, armario generation, componentes (CRUD, stock, import/export), pedidos, pedidos-proveedores (full CRUD + add line + complete), proveedores/almacenes, historial, and XLSX import.

Data layer uses flat-file DB and config-driven paths (e.g. `zenbat.config.js`); main logic lives in `app/controllers/database.server.controller.js` and the various server controllers.
