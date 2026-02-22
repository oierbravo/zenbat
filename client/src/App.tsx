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
import { ListArmarios } from './pages/armarios/ListArmarios';
import { ViewArmario } from './pages/armarios/ViewArmario';
import { GenerarArmario } from './pages/armario-generator/GenerarArmario';
import { ListPedidos } from './pages/pedidos/ListPedidos';
import { ViewPedido } from './pages/pedidos/ViewPedido';
import { ListPedidosProveedores } from './pages/pedidos-proveedores/ListPedidosProveedores';
import { ViewPedidoProveedor } from './pages/pedidos-proveedores/ViewPedidoProveedor';
import { CreatePedidoProveedor } from './pages/pedidos-proveedores/CreatePedidoProveedor';
import { EditPedidoProveedor } from './pages/pedidos-proveedores/EditPedidoProveedor';
import { ListHistorial } from './pages/historial/ListHistorial';

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
          <Route path="/armarios" element={<ListArmarios />} />
          <Route path="/armarios/:armarioId" element={<ViewArmario />} />
          <Route path="/generar-armario" element={<GenerarArmario />} />
          <Route path="/pedidos" element={<ListPedidos />} />
          <Route path="/pedidos/:pedidoId" element={<ViewPedido />} />
          <Route path="/pedidos-proveedores" element={<ListPedidosProveedores />} />
          <Route path="/pedidos-proveedores/create" element={<CreatePedidoProveedor />} />
          <Route path="/pedidos-proveedores/:id" element={<ViewPedidoProveedor />} />
          <Route path="/pedidos-proveedores/:id/edit" element={<EditPedidoProveedor />} />
          <Route path="/historial" element={<ListHistorial />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
