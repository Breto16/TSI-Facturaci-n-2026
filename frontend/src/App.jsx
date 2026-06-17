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
// ...

const CierrePage = () => <h2>Cierre (pendiente, solo admin)</h2>;

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
        <Route path="facturas/:id" element={<FacturaPage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="facturas" element={<FacturasPage />} />
        <Route path="personal" element={<PersonalPage />} />
        <Route
          path="cierre"
          element={
            <PrivateRoute soloAdmin>
              <CierrePage />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;