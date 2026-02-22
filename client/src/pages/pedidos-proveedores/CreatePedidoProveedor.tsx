import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  pedidosProveedoresApi,
  proveedoresApi,
  almacenesApi,
  type CreatePedidoProveedorBody,
} from '../../api/client';

export function CreatePedidoProveedor() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [nPedido, setNPedido] = useState('');
  const [fecha, setFecha] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [almacen, setAlmacen] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const { data: ultimoData } = useQuery({
    queryKey: ['pedidos-proveedores-ultimo'],
    queryFn: pedidosProveedoresApi.getUltimo,
  });
  useEffect(() => {
    if (nPedido === '' && ultimoData?.data != null)
      setNPedido(String(Number(ultimoData.data) + 1));
  }, [ultimoData?.data]);

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores'],
    queryFn: proveedoresApi.list,
  });
  const { data: almacenes = [] } = useQuery({
    queryKey: ['almacenes'],
    queryFn: almacenesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (body: CreatePedidoProveedorBody) => pedidosProveedoresApi.create(body),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-proveedores'] });
      const id = created?.nPedido ?? created?.pedidoProveedorId;
      if (id) navigate(`/pedidos-proveedores/${encodeURIComponent(String(id))}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nPedido.trim()) return;
    createMutation.mutate({
      nPedido: nPedido.trim(),
      fecha: fecha.trim() || undefined,
      fechaEntrega: fechaEntrega.trim() || undefined,
      proveedor: proveedor.trim() || String(proveedores[0]?.proveedorId ?? ''),
      almacen: almacen.trim() || String(almacenes[0]?.almacenId ?? ''),
      observaciones: observaciones.trim() || undefined,
      componentes: [],
    });
  };

  return (
    <div className="space-y-4">
      <Link to="/pedidos-proveedores" className="text-slate-500 hover:text-slate-800">
        ← Pedidos a proveedores
      </Link>
      <h1 className="text-2xl font-semibold text-slate-800">Crear pedido a proveedor</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nº Pedido *</label>
          <input
            type="text"
            value={nPedido}
            onChange={(e) => setNPedido(e.target.value)}
            required
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-800"
          />
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
            <option value="">Seleccionar…</option>
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
            <option value="">Seleccionar…</option>
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
        {createMutation.isError && (
          <p className="text-sm text-red-600">{(createMutation.error as Error).message}</p>
        )}
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Creando…' : 'Crear'}
        </button>
      </form>
    </div>
  );
}
