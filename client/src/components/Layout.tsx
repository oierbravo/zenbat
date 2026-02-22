import { Outlet, Link } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="text-lg font-semibold text-slate-800">
            Zenbat
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              to="/"
              className="rounded px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Inicio
            </Link>
            <Link
              to="/reload"
              className="rounded px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Recargar
            </Link>
            <Link
              to="/componentes"
              className="rounded px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Componentes
            </Link>
            <Link
              to="/stock"
              className="rounded px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Stock
            </Link>
            <Link
              to="/armarios"
              className="rounded px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Armarios
            </Link>
            <Link
              to="/generar-armario"
              className="rounded px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Generar armario
            </Link>
            <Link
              to="/pedidos"
              className="rounded px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Pedidos
            </Link>
            <Link
              to="/pedidos-proveedores"
              className="rounded px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Pedidos proveedores
            </Link>
            <Link
              to="/historial"
              className="rounded px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Historial
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
