import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { pedidosProveedoresApi, type PedidoProveedorDetail } from '../../api/client';

export function ViewPedidoProveedor() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: pedido, isLoading, error } = useQuery({
    queryKey: ['pedido-proveedor', id],
    queryFn: () => pedidosProveedoresApi.get(id!),
    enabled: !!id,
  });

  const completarMutation = useMutation({
    mutationFn: () => pedidosProveedoresApi.completar(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-proveedor', id] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-proveedores'] });
      queryClient.invalidateQueries({ queryKey: ['componentes'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => pedidosProveedoresApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-proveedores'] });
      navigate('/pedidos-proveedores');
    },
  });

  if (!id) return <p className="text-slate-500">Falta ID.</p>;
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Error: {(error as Error).message}
      </div>
    );
  }
  if (isLoading) return <p className="text-slate-500">Cargando…</p>;
  if (!pedido) return <p className="text-slate-500">No encontrado.</p>;

  const p = pedido as PedidoProveedorDetail;
  const componentes = p.componentes ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/pedidos-proveedores" className="text-slate-500 hover:text-slate-800">
          ← Pedidos a proveedores
        </Link>
        <div className="flex gap-2">
          <Link
            to={`/pedidos-proveedores/${encodeURIComponent(id)}/edit`}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Editar
          </Link>
          {p.pendiente && (
            <button
              type="button"
              onClick={() => completarMutation.mutate()}
              disabled={completarMutation.isPending}
              className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {completarMutation.isPending ? 'Completando…' : 'Completar'}
            </button>
          )}
          <button
            type="button"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
      <h1 className="text-2xl font-semibold text-slate-800">Pedido {p.nPedido ?? p.pedidoProveedorId ?? id}</h1>
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <div><span className="text-sm text-slate-500">Proveedor</span><p className="font-medium">{String(p.proveedor ?? '—')}</p></div>
        <div><span className="text-sm text-slate-500">Almacén</span><p className="font-medium">{String(p.almacen ?? '—')}</p></div>
        <div><span className="text-sm text-slate-500">Fecha</span><p className="font-medium">{p.fecha ?? '—'}</p></div>
        <div><span className="text-sm text-slate-500">Fecha entrega</span><p className="font-medium">{p.fechaEntrega ?? '—'}</p></div>
        <div><span className="text-sm text-slate-500">Estado</span><p className="font-medium">{p.pendiente ? 'Pendiente' : p.status ?? '—'}</p></div>
        {p.observaciones && (
          <div className="sm:col-span-2"><span className="text-sm text-slate-500">Observaciones</span><p className="font-medium">{p.observaciones}</p></div>
        )}
      </div>
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-medium text-slate-800">Componentes</h2>
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 font-medium text-slate-700">Código</th>
              <th className="px-4 py-2 font-medium text-slate-700">Cantidad</th>
              <th className="px-4 py-2 font-medium text-slate-700">Recibidos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {componentes.map((c, i) => (
              <tr key={i}>
                <td className="px-4 py-2">{c.codigo}</td>
                <td className="px-4 py-2">{c.qty}</td>
                <td className="px-4 py-2">{c.recibidos ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
