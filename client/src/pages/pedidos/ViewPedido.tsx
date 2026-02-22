import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { pedidosApi, type PedidoListItem } from '../../api/client';

export function ViewPedido() {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const { data: pedido, isLoading, error } = useQuery({
    queryKey: ['pedido', pedidoId],
    queryFn: () => pedidosApi.get(pedidoId!),
    enabled: !!pedidoId,
  });

  if (!pedidoId) return <p className="text-slate-500">Falta ID del pedido.</p>;
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Error: {(error as Error).message}
      </div>
    );
  }
  if (isLoading) return <p className="text-slate-500">Cargando…</p>;
  if (!pedido) return <p className="text-slate-500">No encontrado.</p>;

  const p = pedido as PedidoListItem & { armario?: unknown; stock?: unknown; [key: string]: unknown };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/pedidos" className="text-slate-500 hover:text-slate-800">
          ← Pedidos
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-slate-800">{p.pedidoId ?? pedidoId}</h1>
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <div>
          <span className="text-sm text-slate-500">Código</span>
          <p className="font-medium">{p.codigo ?? '—'}</p>
        </div>
        <div>
          <span className="text-sm text-slate-500">Rev</span>
          <p className="font-medium">{p.rev ?? '—'}</p>
        </div>
        <div>
          <span className="text-sm text-slate-500">Estado</span>
          <p className="font-medium">{p.status ?? '—'}</p>
        </div>
        {p.porEntregar != null && (
          <div>
            <span className="text-sm text-slate-500">Por entregar</span>
            <p className="font-medium">{String(p.porEntregar)}</p>
          </div>
        )}
      </div>
      {p.armario != null ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-medium text-slate-800">Armario</h2>
          <pre className="overflow-auto text-xs text-slate-600">
            {JSON.stringify(p.armario, null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
