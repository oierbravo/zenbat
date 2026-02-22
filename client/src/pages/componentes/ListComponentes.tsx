import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { componentesApi, type Componente } from '../../api/client';

export function ListComponentes() {
  const { data: componentes, isLoading, error } = useQuery({
    queryKey: ['componentes'],
    queryFn: componentesApi.list,
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-800">Componentes</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/importar-componentes"
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600"
          >
            Importar
          </Link>
          <Link
            to="/export-componentes"
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600"
          >
            Exportar
          </Link>
          <Link
            to="/componentes-reload"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Recargar desde fichero
          </Link>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : componentes && componentes.length === 0 ? (
        <p className="text-slate-500">No hay componentes.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 font-medium text-slate-700">Código</th>
                <th className="px-4 py-2 font-medium text-slate-700">Denominación</th>
                <th className="px-4 py-2 font-medium text-slate-700">Cantidad</th>
                <th className="px-4 py-2 font-medium text-slate-700">Reservada</th>
                <th className="px-4 py-2 font-medium text-slate-700">Stock seg.</th>
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
                  <td className="px-4 py-2">{c.cantidadReservada ?? '—'}</td>
                  <td className="px-4 py-2">{c.stockSeguridad ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
