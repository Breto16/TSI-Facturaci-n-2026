import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoginPage from './pages/Login/LoginPage';
import PrivateRoute from './components/common/PrivateRoute';
import ProductosPage from './pages/Productos/ProductosPage';
import MesasPage from './pages/Mesas/MesasPage'
import InicioPage from './pages/Inicio/InicioPage';
import FacturaPage from './pages/Facturas/FacturaPage'
import FacturasPage from './pages/Facturas/FacturasPage'
import PersonalPage from './pages/Personal/PersonalPage'
import ConsultasPage from './pages/Consultas/ConsultasPage'
import CierrePage from './pages/Cierre/CierrePage'
import ComandaMesaPage from './pages/Comandas/ComandaMesaPage'
import ValidacionPage from './pages/Validacion/ValidacionPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<MesasPage />} />
        <Route path="inicio" element={<InicioPage />} />
        <Route path="mesas" element={<MesasPage />} />
        <Route path="comandas/factura/:facturaId" element={<ComandaMesaPage />} />
        <Route
          path="facturas/:id"
          element={
            <PrivateRoute roles={['admin', 'cajero']}>
              <FacturaPage />
            </PrivateRoute>
          }
        />
        <Route
          path="productos"
          element={
            <PrivateRoute roles={['admin', 'cajero']}>
              <ProductosPage />
            </PrivateRoute>
          }
        />
        <Route
          path="facturas"
          element={
            <PrivateRoute roles={['admin', 'cajero']}>
              <FacturasPage />
            </PrivateRoute>
          }
        />
        <Route path="personal" element={<PersonalPage />} />
        <Route path="consultas" element={<ConsultasPage />} />
        <Route path="validacion" element={<ValidacionPage />} />
        <Route
          path="cierre"
          element={
            <PrivateRoute roles={['admin']}>
              <CierrePage />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;