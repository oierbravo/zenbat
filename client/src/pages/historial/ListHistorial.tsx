import { useQuery } from '@tanstack/react-query';
import { historialApi, type HistorialEntry } from '../../api/client';

export function ListHistorial() {
  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['historial'],
    queryFn: historialApi.list,
  });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Error: {(error as Error).message}
      </div>
    );
  }

  const list = Array.isArray(entries) ? entries : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Historial</h1>
      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : list.length === 0 ? (
        <p className="text-slate-500">No hay entradas en el historial.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 font-medium text-slate-700">Fecha</th>
                <th className="px-4 py-2 font-medium text-slate-700">Nivel</th>
                <th className="px-4 py-2 font-medium text-slate-700">Categoría</th>
                <th className="px-4 py-2 font-medium text-slate-700">Mensaje</th>
                <th className="px-4 py-2 font-medium text-slate-700">Código</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((e: HistorialEntry, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-600">{e.timestamp ?? '—'}</td>
                  <td className="px-4 py-2">{e.level ?? '—'}</td>
                  <td className="px-4 py-2">{e.categoria ?? '—'}</td>
                  <td className="px-4 py-2">{e.message ?? '—'}</td>
                  <td className="px-4 py-2">{e.codigo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
