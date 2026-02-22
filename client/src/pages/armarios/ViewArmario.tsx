import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  armariosApi,
  exportArmario,
  type ArmarioDetail,
} from '../../api/client';

export function ViewArmario() {
  const { armarioId } = useParams<{ armarioId: string }>();
  const queryClient = useQueryClient();
  const [verificarQty, setVerificarQty] = useState(1);
  const [exporting, setExporting] = useState(false);

  const { data: armario, isLoading, error } = useQuery({
    queryKey: ['armario', armarioId],
    queryFn: () => armariosApi.get(armarioId!),
    enabled: !!armarioId,
  });

  const verificarMutation = useMutation({
    mutationFn: () => armariosApi.verificar(armarioId!, verificarQty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armario', armarioId] });
    },
  });

  const entregarMutation = useMutation({
    mutationFn: () => armariosApi.entregar(armarioId!, verificarQty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armario', armarioId] });
      queryClient.invalidateQueries({ queryKey: ['componentes'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });

  const handleExport = async () => {
    if (!armarioId) return;
    setExporting(true);
    try {
      const blob = await exportArmario(armarioId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${armarioId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (!armarioId) return <p className="text-slate-500">Falta ID del armario.</p>;
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Error: {(error as Error).message}
      </div>
    );
  }
  if (isLoading) return <p className="text-slate-500">Cargando…</p>;
  if (!armario) return <p className="text-slate-500">No encontrado.</p>;

  const a = armario as ArmarioDetail;
  const componentes = a.componentes ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/armarios" className="text-slate-500 hover:text-slate-800">
          ← Armarios
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-slate-800">{a.id}</h1>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2">
          <label className="text-sm text-slate-600">Cantidad:</label>
          <input
            type="number"
            min={1}
            value={verificarQty}
            onChange={(e) => setVerificarQty(Number(e.target.value) || 1)}
            className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => verificarMutation.mutate()}
            disabled={verificarMutation.isPending}
            className="rounded bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600 disabled:opacity-50"
          >
            {verificarMutation.isPending ? 'Comprobando…' : 'Verificar stock'}
          </button>
        </div>
        {verificarMutation.data && (
          <p className="text-sm text-slate-600">
            Verificar: {(verificarMutation.data as { status?: string }).status ?? String(verificarMutation.data)}
          </p>
        )}
        <button
          type="button"
          onClick={() => entregarMutation.mutate()}
          disabled={entregarMutation.isPending}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {entregarMutation.isPending ? 'Entregando…' : 'Entregar'}
        </button>
        {entregarMutation.data != null && (
          <span className="text-sm text-slate-600">Entregar: {String(entregarMutation.data)}</span>
        )}
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          {exporting ? 'Exportando…' : 'Exportar XLSX'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 font-medium text-slate-700">Código</th>
              <th className="px-4 py-2 font-medium text-slate-700">Denominación</th>
              <th className="px-4 py-2 font-medium text-slate-700">Cantidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {componentes.map((c, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-2">{c.Codigo ?? '—'}</td>
                <td className="px-4 py-2">{c.Denominacion ?? '—'}</td>
                <td className="px-4 py-2">{c.Cantidad ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
