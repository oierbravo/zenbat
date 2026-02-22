import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/core/Home';
import { Reload } from './pages/core/Reload';
import { ListComponentes } from './pages/componentes/ListComponentes';
import { ViewComponente } from './pages/componentes/ViewComponente';
import { Stock } from './pages/componentes/Stock';
import { ImportarComponentes } from './pages/componentes/ImportarComponentes';
import { ExportComponentes } from './pages/componentes/ExportComponentes';
import { ComponentesReload } from './pages/componentes/ComponentesReload';
import { Placeholder } from './pages/Placeholder';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/reload" element={<Reload />} />
          <Route path="/componentes" element={<ListComponentes />} />
          <Route path="/componentes/:componenteId" element={<ViewComponente />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/importar-componentes" element={<ImportarComponentes />} />
          <Route path="/export-componentes" element={<ExportComponentes />} />
          <Route path="/componentes-reload" element={<ComponentesReload />} />
          <Route path="/armarios" element={<Placeholder title="Armarios" />} />
          <Route path="/armarios/:armarioId" element={<Placeholder title="Armario" />} />
          <Route path="/generar-armario" element={<Placeholder title="Generar armario" />} />
          <Route path="/pedidos" element={<Placeholder title="Pedidos" />} />
          <Route path="/pedidos/:pedidoId" element={<Placeholder title="Pedido" />} />
          <Route path="/pedidos-proveedores" element={<Placeholder title="Pedidos proveedores" />} />
          <Route path="/pedidos-proveedores/create" element={<Placeholder title="Crear pedido proveedor" />} />
          <Route path="/pedidos-proveedores/:id" element={<Placeholder title="Pedido proveedor" />} />
          <Route path="/pedidos-proveedores/:id/edit" element={<Placeholder title="Editar pedido proveedor" />} />
          <Route path="/historial" element={<Placeholder title="Historial" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
