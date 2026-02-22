import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '../../api/client';

export function ComponentesReload() {
  const queryClient = useQueryClient();
  const { mutate, isPending, isSuccess, isError } = useMutation({
    mutationFn: coreApi.reloadCli,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['componentes'] });
      queryClient.invalidateQueries({ queryKey: ['home-data'] });
      queryClient.invalidateQueries({ queryKey: ['leyenda'] });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Recargar componentes desde fichero</h1>
      <p className="text-slate-600">
        Recarga la lista de componentes desde el fichero de configuración (re-read).
      </p>
      <button
        type="button"
        onClick={() => mutate()}
        disabled={isPending}
        className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? 'Recargando…' : 'Recargar'}
      </button>
      {isSuccess && <p className="text-green-700">Recarga completada.</p>}
      {isError && <p className="text-red-700">Error al recargar.</p>}
    </div>
  );
}
