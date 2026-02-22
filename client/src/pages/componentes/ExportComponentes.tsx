import { useState } from 'react';
import { exportComponentes } from '../../api/client';

export function ExportComponentes() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setError(null);
    setDownloading(true);
    try {
      const blob = await exportComponentes();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-componentes_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Exportar componentes</h1>
      <p className="text-slate-600">
        Descarga todos los componentes en un archivo XLSX.
      </p>
      {error && (
        <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {downloading ? 'Descargando…' : 'Descargar XLSX'}
      </button>
    </div>
  );
}
