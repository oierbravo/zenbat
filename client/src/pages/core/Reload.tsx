import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '../../api/client';

export function Reload() {
  const queryClient = useQueryClient();
  const { mutate, isPending, isSuccess, isError, data } = useMutation({
    mutationFn: coreApi.reloadCli,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-data'] });
      queryClient.invalidateQueries({ queryKey: ['leyenda'] });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Recargar datos</h1>
      <p className="text-slate-600">
        Recarga la configuración y los datos desde los ficheros (re-read config/files).
      </p>
      <button
        type="button"
        onClick={() => mutate()}
        disabled={isPending}
        className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? 'Recargando…' : 'Recargar'}
      </button>
      {isSuccess && (
        <p className="text-green-700">
          Recarga completada. {data && typeof data === 'object' && 'message' in data && (data as { message?: string }).message}
        </p>
      )}
      {isError && (
        <p className="text-red-700">Error al recargar. Inténtalo de nuevo.</p>
      )}
    </div>
  );
}
