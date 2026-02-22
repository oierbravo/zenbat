import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  componentesApi,
  pedidosProveedoresApi,
  addToPedidoProveedor,
  type Componente,
  type PedidoProveedorListItem,
} from '../../api/client';

function AddToPedidoModal({
  codigo,
  onClose,
  onSuccess,
}: {
  codigo: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: pedidos = [] } = useQuery({
    queryKey: ['pedidos-proveedores'],
    queryFn: pedidosProveedoresApi.list,
  });
  const pendientes = (pedidos as PedidoProveedorListItem[]).filter(
    (p) => (p.status ?? '').toString().toLowerCase() === 'pendiente'
  );
  const [nPedido, setNPedido] = useState('');
  const [qty, setQty] = useState(1);
  const [unidad, setUnidad] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nPedido.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await addToPedidoProveedor({
        nPedido: nPedido.trim(),
        codigo,
        qty: Number(qty) || 0,
        unidad: unidad.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['componentes'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-proveedores'] });
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          Añadir a pedido proveedor
        </h2>
        <p className="mb-3 text-sm text-slate-600">Componente: {codigo}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Pedido (nº)
            </label>
            <select
              value={nPedido}
              onChange={(e) => setNPedido(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-800"
              required
            >
              <option value="">Seleccionar…</option>
              {pendientes.map((p) => (
                <option key={p.pedidoProveedorId ?? p.nPedido} value={p.nPedido ?? p.pedidoProveedorId ?? ''}>
                  {p.nPedido ?? p.pedidoProveedorId ?? '—'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Cantidad
            </label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value) || 0)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Unidad (opcional)
            </label>
            <input
              type="text"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-slate-800"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {submitting ? 'Enviando…' : 'Añadir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Stock() {
  const queryClient = useQueryClient();
  const { data: componentes, isLoading, error } = useQuery({
    queryKey: ['componentes'],
    queryFn: componentesApi.list,
  });
  const [adjustCodigo, setAdjustCodigo] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [addToPedidoCodigo, setAddToPedidoCodigo] = useState<string | null>(null);

  const stockMutation = useMutation({
    mutationFn: ({ codigo, qty }: { codigo: string; qty: number }) =>
      componentesApi.stock(codigo, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['componentes'] });
      setAdjustCodigo(null);
      setAdjustQty('');
    },
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
      <h1 className="text-2xl font-semibold text-slate-800">Stock</h1>
      <p className="text-slate-600">
        Ajustar cantidades o añadir componentes a un pedido a proveedor.
      </p>

      {addToPedidoCodigo && (
        <AddToPedidoModal
          codigo={addToPedidoCodigo}
          onClose={() => setAddToPedidoCodigo(null)}
          onSuccess={() => {}}
        />
      )}

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 font-medium text-slate-700">Código</th>
                <th className="px-4 py-2 font-medium text-slate-700">Denominación</th>
                <th className="px-4 py-2 font-medium text-slate-700">Cantidad</th>
                <th className="px-4 py-2 font-medium text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(componentes ?? []).map((c: Componente) => (
                <tr key={c.codigo} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link
                      to={`/componentes/${encodeURIComponent(c.codigo)}`}
                      className="font-medium text-slate-800 hover:underline"
                    >
                      {c.codigo}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{c.denominacion ?? '—'}</td>
                  <td className="px-4 py-2">{c.cantidad ?? '—'}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {adjustCodigo === c.codigo ? (
                        <>
                          <input
                            type="number"
                            value={adjustQty}
                            onChange={(e) => setAdjustQty(e.target.value)}
                            placeholder="+/- cantidad"
                            className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              stockMutation.mutate({
                                codigo: c.codigo,
                                qty: Number(adjustQty) || 0,
                              })
                            }
                            disabled={stockMutation.isPending}
                            className="rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600 disabled:opacity-50"
                          >
                            Aplicar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustCodigo(null);
                              setAdjustQty('');
                            }}
                            className="text-xs text-slate-500 hover:text-slate-700"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustCodigo(c.codigo);
                            setAdjustQty('');
                          }}
                          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          Ajustar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setAddToPedidoCodigo(c.codigo)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        Añadir a pedido
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
