import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { pedidosProveedoresApi, type PedidoProveedorDetail } from '../../api/client';

export function ListPedidosProveedores() {
  const { data: pedidos, isLoading, error } = useQuery({
    queryKey: ['pedidos-proveedores'],
    queryFn: pedidosProveedoresApi.list,
  });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Error: {(error as Error).message}
      </div>
    );
  }

  const idKey = (p: PedidoProveedorDetail) => p.nPedido ?? p.pedidoProveedorId ?? '';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Pedidos a proveedores</h1>
        <Link
          to="/pedidos-proveedores/create"
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          Crear pedido
        </Link>
      </div>
      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : pedidos && pedidos.length === 0 ? (
        <p className="text-slate-500">No hay pedidos a proveedores.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 font-medium text-slate-700">Nº Pedido</th>
                <th className="px-4 py-2 font-medium text-slate-700">Proveedor</th>
                <th className="px-4 py-2 font-medium text-slate-700">Almacén</th>
                <th className="px-4 py-2 font-medium text-slate-700">Fecha</th>
                <th className="px-4 py-2 font-medium text-slate-700">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(pedidos ?? []).map((p: PedidoProveedorDetail) => (
                <tr key={idKey(p)} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link
                      to={`/pedidos-proveedores/${encodeURIComponent(idKey(p))}`}
                      className="font-medium text-slate-800 hover:underline"
                    >
                      {p.nPedido ?? p.pedidoProveedorId ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{String(p.proveedor ?? '—')}</td>
                  <td className="px-4 py-2">{String(p.almacen ?? '—')}</td>
                  <td className="px-4 py-2">{p.fecha ?? '—'}</td>
                  <td className="px-4 py-2">{p.pendiente ? 'Pendiente' : p.status ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
