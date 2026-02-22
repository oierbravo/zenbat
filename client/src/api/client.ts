/**
 * Base API client. In dev, Vite proxies requests to Express (see vite.config.ts).
 * Uses same-origin in production when React is served by Express.
 */
const getBaseUrl = () => {
  if (import.meta.env.DEV) return ''; // Vite proxy
  return '';
};

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`);
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) return res.json() as Promise<T>;
  return res.text() as Promise<T>;
}

export async function apiGetText(path: string): Promise<string> {
  const res = await fetch(`${getBaseUrl()}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`);
  return res.text();
}

export const homeApi = {
  getHomeData: () => apiGet<HomeData>('/get-home-data'),
  getLeyenda: () => apiGetText('/leyenda'),
};

export const coreApi = {
  reloadCli: () => apiGet<{ message?: string }>('/reload-cli'),
};

// Componentes API
export interface Componente {
  codigo: string;
  denominacion?: string;
  cantidad?: number;
  cantidadReservada?: number;
  cantidadReal?: number;
  stockSeguridad?: number;
  cantidadRecomendada?: number;
  pedidos?: { pedidoId: string; qty: number }[];
  pedidosProveedores?: { pedidoProveedorId: string; qty: number; recibidos?: number }[];
  [key: string]: unknown;
}

export const componentesApi = {
  list: () => apiGet<Componente[]>('/componentes'),
  get: (componenteId: string) => apiGet<Componente>(`/componentes/${encodeURIComponent(componenteId)}`),
  stock: (componenteId: string, qty: number) =>
    apiGet<Componente>(`/componentes/${encodeURIComponent(componenteId)}/stock?qty=${qty}`),
};

export async function importComponentesFile(file: File): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  const base = getBaseUrl();
  const res = await fetch(`${base}/import/archivo`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Import error: ${res.status}`);
}

export async function exportComponentes(): Promise<Blob> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/export-componentes`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Export error: ${res.status}`);
  return res.blob();
}

// Armarios API
export interface ArmarioListItem {
  id: string;
  filename?: string;
  componente?: unknown[];
  [key: string]: unknown;
}

export interface ArmarioDetail {
  id: string;
  componentes?: { Codigo?: string; Cantidad?: number; Denominacion?: string; [key: string]: unknown }[];
  [key: string]: unknown;
}

export const armariosApi = {
  list: () => apiGet<ArmarioListItem[]>('/armarios'),
  get: (armarioId: string) => apiGet<ArmarioDetail>(`/armarios/${encodeURIComponent(armarioId)}`),
  verificar: (armarioId: string, qty?: number) => {
    const q = qty != null ? `?qty=${qty}` : '';
    return apiGet<{ status: string; componentes?: unknown[] }>(`/armarios/${encodeURIComponent(armarioId)}/verificar${q}`);
  },
  entregar: (armarioId: string, qty?: number, pedidoId?: string) => {
    const params = new URLSearchParams();
    if (qty != null) params.set('qty', String(qty));
    if (pedidoId) params.set('pedidoId', pedidoId);
    const q = params.toString() ? `?${params.toString()}` : '';
    return apiGet<string | { status?: string }>(`/armarios/${encodeURIComponent(armarioId)}/entregar${q}`);
  },
};

export async function exportArmario(armarioId: string): Promise<Blob> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/armarios/${encodeURIComponent(armarioId)}/exportar`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Export armario error: ${res.status}`);
  return res.blob();
}

// Armario generator: POST then GET download
export interface GenerarArmarioItem {
  codigo: string;
  cantidad?: number | string;
  denominacion?: string;
  'Codigo Material'?: string;
  'Cantidad'?: number | string;
  'Denominación'?: string;
  [key: string]: unknown;
}

export async function postGenerarArmario(body: {
  nombreArchivo: string;
  componentes: GenerarArmarioItem[];
}): Promise<void> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/generar-armario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Generar armario error: ${res.status}`);
  // Backend redirects to GET /generar-armario/:nombreArchivo; we don't follow redirect for JSON, so we just succeed and client will call download next
}

export async function downloadGenerarArmario(nombreArchivo: string): Promise<Blob> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/generar-armario/${encodeURIComponent(nombreArchivo)}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Download armario error: ${res.status}`);
  return res.blob();
}

// Pedidos (internal) API
export interface PedidoListItem {
  pedidoId?: string;
  codigo?: string;
  rev?: string;
  status?: string;
  [key: string]: unknown;
}

export const pedidosApi = {
  list: () => apiGet<PedidoListItem[]>('/pedidos'),
  get: (pedidoId: string) => apiGet<PedidoListItem>(`/pedidos/${encodeURIComponent(pedidoId)}`),
};

export const pedidosProveedoresApi = {
  list: () => apiGet<PedidoProveedorDetail[]>('/pedidos-proveedores'),
  get: (id: string) => apiGet<PedidoProveedorDetail>(`/pedidos-proveedores/${encodeURIComponent(id)}`),
  getUltimo: () => apiGet<{ data?: number }>('/pedidos-proveedores-ultimo'),
  create: (body: CreatePedidoProveedorBody) => apiPost<PedidoProveedorDetail>('/pedidos-proveedores', body),
  update: (id: string, body: Partial<CreatePedidoProveedorBody>) =>
    apiPut<PedidoProveedorDetail>(`/pedidos-proveedores/${encodeURIComponent(id)}`, body),
  delete: (id: string) => apiDelete(`/pedidos-proveedores/${encodeURIComponent(id)}`),
  completar: (id: string) => apiGet<{ message?: string }>(`/pedidos-proveedores/${encodeURIComponent(id)}/completar`),
};

export interface PedidoProveedorDetail {
  nPedido?: string;
  pedidoProveedorId?: string;
  proveedor?: string;
  almacen?: string;
  fecha?: string;
  fechaEntrega?: string;
  observaciones?: string;
  pendiente?: boolean;
  status?: string;
  componentes?: { codigo: string; qty: number; recibidos?: number; unidad?: string }[];
  proveedorData?: unknown;
  almacenData?: unknown;
  [key: string]: unknown;
}

export interface CreatePedidoProveedorBody {
  nPedido: string;
  fecha?: string;
  fechaEntrega?: string;
  proveedor: string;
  almacen: string;
  observaciones?: string;
  componentes?: { codigo: string; qty: number; recibidos?: number; unidad?: string }[];
}

export const proveedoresApi = {
  list: () => apiGet<{ proveedorId?: string; Nombre?: string; [key: string]: unknown }[]>('/proveedores'),
};

export const almacenesApi = {
  list: () => apiGet<{ almacenId?: string; Nombre?: string; [key: string]: unknown }[]>('/almacenes'),
};

// Historial API
export const historialApi = {
  list: () => apiGet<HistorialEntry[]>('/historial'),
};

export interface HistorialEntry {
  message?: string;
  codigo?: string;
  categoria?: string;
  timestamp?: string;
  level?: string;
  [key: string]: unknown;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`);
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) return res.json() as Promise<T>;
  return undefined as T;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`);
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) return res.json() as Promise<T>;
  return undefined as T;
}

async function apiDelete(path: string): Promise<void> {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`);
}

export type PedidoProveedorListItem = PedidoProveedorDetail;

export async function addToPedidoProveedor(body: {
  nPedido: string;
  codigo: string;
  qty: number;
  unidad?: string;
}): Promise<{ message?: string }> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/add-to-pedido-proveedor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Add to pedido error: ${res.status}`);
  return res.json();
}

// Types matching backend responses (RESEARCH.md)
export interface HomeData {
  proximos: unknown[];
  numComponentes: number;
  pedidosFaltan: unknown[];
  pedidosProveedoresPendientes: unknown[];
}
