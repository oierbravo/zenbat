import { useParams } from 'react-router-dom';

type Props = { title: string };

export function Placeholder({ title }: Props) {
  const params = useParams();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
      <p className="text-slate-600">Página en construcción.</p>
      {Object.keys(params).length > 0 && (
        <p className="text-sm text-slate-500">Params: {JSON.stringify(params)}</p>
      )}
    </div>
  );
}
