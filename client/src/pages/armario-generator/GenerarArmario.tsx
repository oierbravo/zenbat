import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  postGenerarArmario,
  downloadGenerarArmario,
  type GenerarArmarioItem,
} from '../../api/client';

// Simple parser: one line per component, "codigo cantidad denominacion" or "codigo cantidad" (rest is denominacion)
function parsePastedLines(text: string): GenerarArmarioItem[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const items: GenerarArmarioItem[] = [];
  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      const codigo = parts[0];
      const cantidad = parts[1];
      const denominacion = parts.slice(2).join(' ') || codigo;
      items.push({
        codigo,
        cantidad,
        denominacion,
        'Codigo Material': codigo,
        'Cantidad': cantidad,
        'Denominación': denominacion,
      });
    }
  }
  return items;
}

export function GenerarArmario() {
  const [pastedText, setPastedText] = useState('');
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const componentes = parsePastedLines(pastedText);
      if (componentes.length === 0) throw new Error('Introduce al menos una línea (código cantidad denominación).');
      const name = nombreArchivo.trim() || `armario-${Date.now()}`;
      await postGenerarArmario({ nombreArchivo: name, componentes });
      const blob = await downloadGenerarArmario(name);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (err) => setError((err as Error).message),
    onSuccess: () => setError(null),
  });

  const preview = parsePastedLines(pastedText);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Generar armario</h1>
      <p className="text-slate-600">
        Pega líneas con formato: <strong>código cantidad denominación</strong> (separados por espacios). El servidor generará un XLSX con precios y proveedor desde la base de componentes.
      </p>
      <div className="max-w-2xl space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Nombre del archivo (opcional)
          </label>
          <input
            type="text"
            value={nombreArchivo}
            onChange={(e) => setNombreArchivo(e.target.value)}
            placeholder="armario-generado"
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Líneas (código cantidad denominación)
          </label>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={12}
            placeholder="COD001 2 Descripción del componente&#10;COD002 1 Otro componente"
            className="w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm text-slate-800"
          />
        </div>
        {preview.length > 0 && (
          <p className="text-sm text-slate-500">
            {preview.length} línea(s) detectada(s).
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <button
          type="button"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || preview.length === 0}
          className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {generateMutation.isPending ? 'Generando…' : 'Generar y descargar XLSX'}
        </button>
      </div>
    </div>
  );
}
