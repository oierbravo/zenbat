import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { pedidosApi, type PedidoListItem } from '../../api/client';

export function ListPedidos() {
  const { data: pedidos, isLoading, error } = useQuery({
    queryKey: ['pedidos'],
    queryFn: pedidosApi.list,
  });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Error: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Pedidos</h1>
      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : pedidos && pedidos.length === 0 ? (
        <p className="text-slate-500">No hay pedidos.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 font-medium text-slate-700">Pedido ID</th>
                <th className="px-4 py-2 font-medium text-slate-700">Código</th>
                <th className="px-4 py-2 font-medium text-slate-700">Rev</th>
                <th className="px-4 py-2 font-medium text-slate-700">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(pedidos ?? []).map((p: PedidoListItem) => (
                <tr key={String(p.pedidoId)} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link
                      to={`/pedidos/${encodeURIComponent(String(p.pedidoId ?? ''))}`}
                      className="font-medium text-slate-800 hover:underline"
                    >
                      {p.pedidoId ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{p.codigo ?? '—'}</td>
                  <td className="px-4 py-2">{p.rev ?? '—'}</td>
                  <td className="px-4 py-2">{p.status ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
