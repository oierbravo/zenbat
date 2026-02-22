import { useQuery } from '@tanstack/react-query';
import { homeApi } from '../../api/client';

export function Home() {
  const { data: homeData, isLoading, error } = useQuery({
    queryKey: ['home-data'],
    queryFn: homeApi.getHomeData,
  });

  const { data: leyendaHtml, isLoading: leyendaLoading } = useQuery({
    queryKey: ['leyenda'],
    queryFn: homeApi.getLeyenda,
  });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Error al cargar datos: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Inicio</h1>

      {isLoading ? (
        <p className="text-slate-500">Cargando datos…</p>
      ) : homeData ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Componentes</div>
            <div className="text-2xl font-semibold text-slate-800">
              {homeData.numComponentes}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Pedidos con faltantes</div>
            <div className="text-2xl font-semibold text-slate-800">
              {homeData.pedidosFaltan?.length ?? 0}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Pedidos proveedores pendientes</div>
            <div className="text-2xl font-semibold text-slate-800">
              {homeData.pedidosProveedoresPendientes?.length ?? 0}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">Próximos</div>
            <div className="text-2xl font-semibold text-slate-800">
              {homeData.proximos?.length ?? 0}
            </div>
          </div>
        </div>
      ) : null}

      {leyendaLoading ? (
        <p className="text-slate-500">Cargando leyenda…</p>
      ) : leyendaHtml ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-slate-800">Leyenda</h2>
          <div
            className="prose prose-slate max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: leyendaHtml as string }}
          />
        </section>
      ) : null}
    </div>
  );
}
