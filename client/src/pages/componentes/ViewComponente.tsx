import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { componentesApi, type Componente } from '../../api/client';

export function ViewComponente() {
  const { componenteId } = useParams<{ componenteId: string }>();
  const { data: componente, isLoading, error } = useQuery({
    queryKey: ['componente', componenteId],
    queryFn: () => componentesApi.get(componenteId!),
    enabled: !!componenteId,
  });

  if (!componenteId) return <p className="text-slate-500">Falta ID del componente.</p>;
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Error: {(error as Error).message}
      </div>
    );
  }

  if (isLoading) return <p className="text-slate-500">Cargando…</p>;
  if (!componente) return <p className="text-slate-500">No encontrado.</p>;

  const c = componente as Componente;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/componentes" className="text-slate-500 hover:text-slate-800">
          ← Componentes
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-slate-800">{c.codigo}</h1>
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <div>
          <span className="text-sm text-slate-500">Denominación</span>
          <p className="font-medium">{c.denominacion ?? '—'}</p>
        </div>
        <div>
          <span className="text-sm text-slate-500">Cantidad</span>
          <p className="font-medium">{c.cantidad ?? '—'}</p>
        </div>
        <div>
          <span className="text-sm text-slate-500">Cantidad reservada</span>
          <p className="font-medium">{c.cantidadReservada ?? '—'}</p>
        </div>
        <div>
          <span className="text-sm text-slate-500">Stock seguridad</span>
          <p className="font-medium">{c.stockSeguridad ?? '—'}</p>
        </div>
        <div>
          <span className="text-sm text-slate-500">Cantidad recomendada</span>
          <p className="font-medium">{c.cantidadRecomendada ?? '—'}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          to={`/stock`}
          className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600"
        >
          Ver en Stock
        </Link>
      </div>
    </div>
  );
}
