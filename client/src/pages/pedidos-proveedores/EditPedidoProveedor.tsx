import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  pedidosProveedoresApi,
  proveedoresApi,
  almacenesApi,
  type PedidoProveedorDetail,
  type CreatePedidoProveedorBody,
} from '../../api/client';

export function EditPedidoProveedor() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [nPedido, setNPedido] = useState('');
  const [fecha, setFecha] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [almacen, setAlmacen] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const { data: pedido, isLoading, error } = useQuery({
    queryKey: ['pedido-proveedor', id],
    queryFn: () => pedidosProveedoresApi.get(id!),
    enabled: !!id,
  });

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores'],
    queryFn: proveedoresApi.list,
  });
  const { data: almacenes = [] } = useQuery({
    queryKey: ['almacenes'],
    queryFn: almacenesApi.list,
  });

  useEffect(() => {
    if (pedido) {
      const p = pedido as PedidoProveedorDetail;
      setNPedido(String(p.nPedido ?? p.pedidoProveedorId ?? ''));
      setFecha(p.fecha ?? '');
      setFechaEntrega(p.fechaEntrega ?? '');
      setProveedor(String(p.proveedor ?? ''));
      setAlmacen(String(p.almacen ?? ''));
      setObservaciones(p.observaciones ?? '');
    }
  }, [pedido]);

  const updateMutation = useMutation({
    mutationFn: (body: Partial<CreatePedidoProveedorBody>) =>
      pedidosProveedoresApi.update(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido-proveedor', id] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-proveedores'] });
      navigate(`/pedidos-proveedores/${encodeURIComponent(id!)}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      fecha: fecha.trim() || undefined,
      fechaEntrega: fechaEntrega.trim() || undefined,
      proveedor: proveedor.trim(),
      almacen: almacen.trim(),
      observaciones: observaciones.trim() || undefined,
    });
  };

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

  return (
    <div className="space-y-4">
      <Link to="/pedidos-proveedores" className="text-slate-500 hover:text-slate-800">
        ← Pedidos a proveedores
      </Link>
      <h1 className="text-2xl font-semibold text-slate-800">Editar pedido {nPedido || id}</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nº Pedido</label>
          <input type="text" value={nPedido} disabled className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Fecha</label>
          <input
            type="text"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            placeholder="YYYY-MM-DD"
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Fecha entrega</label>
          <input
            type="text"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            placeholder="YYYY-MM-DD"
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Proveedor</label>
          <select
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-800"
          >
            {(proveedores as { proveedorId?: number; Nombre?: string }[]).map((pr, i) => (
              <option key={i} value={String(pr.proveedorId ?? i)}>
                {pr.Nombre ?? pr.proveedorId ?? i}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Almacén</label>
          <select
            value={almacen}
            onChange={(e) => setAlmacen(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-800"
          >
            {(almacenes as { almacenId?: number; Nombre?: string }[]).map((al, i) => (
              <option key={i} value={String(al.almacenId ?? i)}>
                {al.Nombre ?? al.almacenId ?? i}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Observaciones</label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-800"
          />
        </div>
        {updateMutation.isError && (
          <p className="text-sm text-red-600">{(updateMutation.error as Error).message}</p>
        )}
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}
