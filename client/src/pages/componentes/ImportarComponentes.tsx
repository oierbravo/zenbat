import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importComponentesFile } from '../../api/client';

export function ImportarComponentes() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [selectedName, setSelectedName] = useState('');

  const importMutation = useMutation({
    mutationFn: (f: File) => importComponentesFile(f),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['componentes'] });
      queryClient.invalidateQueries({ queryKey: ['home-data'] });
      setFile(null);
      setSelectedName('');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setSelectedName(f.name);
    } else {
      setFile(null);
      setSelectedName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    importMutation.mutate(file);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Importar componentes</h1>
      <p className="text-slate-600">
        Sube un archivo XLSX con columnas <code className="rounded bg-slate-100 px-1">codigo</code> y{' '}
        <code className="rounded bg-slate-100 px-1">cantidadReal</code> para actualizar cantidades.
      </p>
      <form onSubmit={handleSubmit} className="max-w-md space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Archivo XLSX
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-slate-700"
          />
          {selectedName && (
            <p className="mt-1 text-sm text-slate-500">Seleccionado: {selectedName}</p>
          )}
        </div>
        {importMutation.isError && (
          <p className="text-sm text-red-600">{(importMutation.error as Error).message}</p>
        )}
        {importMutation.isSuccess && (
          <p className="text-sm text-green-700">Importación completada.</p>
        )}
        <button
          type="submit"
          disabled={!file || importMutation.isPending}
          className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {importMutation.isPending ? 'Importando…' : 'Importar'}
        </button>
      </form>
    </div>
  );
}
