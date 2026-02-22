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

export const pedidosProveedoresApi = {
  list: () => apiGet<PedidoProveedorListItem[]>('/pedidos-proveedores'),
};

export interface PedidoProveedorListItem {
  nPedido?: string;
  pedidoProveedorId?: string;
  proveedorId?: string;
  status?: string;
  [key: string]: unknown;
}

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
