import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { armariosApi, type ArmarioListItem } from '../../api/client';

export function ListArmarios() {
  const { data: armarios, isLoading, error } = useQuery({
    queryKey: ['armarios'],
    queryFn: armariosApi.list,
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
      <h1 className="text-2xl font-semibold text-slate-800">Armarios</h1>
      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : armarios && armarios.length === 0 ? (
        <p className="text-slate-500">No hay armarios.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 font-medium text-slate-700">ID</th>
                <th className="px-4 py-2 font-medium text-slate-700">Archivo</th>
                <th className="px-4 py-2 font-medium text-slate-700">Líneas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(armarios ?? []).map((a: ArmarioListItem) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link
                      to={`/armarios/${encodeURIComponent(a.id)}`}
                      className="font-medium text-slate-800 hover:underline"
                    >
                      {a.id}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{a.filename ?? a.id}</td>
                  <td className="px-4 py-2">
                    {Array.isArray(a.componente) ? a.componente.length : 0}
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
