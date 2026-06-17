import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { User, Lock, UtensilsCrossed } from 'lucide-react';
import { loginRequest } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const datos = await loginRequest(usuario, password);
      login(datos);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}
    >
      <div
        className="app-surface p-4 shadow-sm"
        style={{ width: '360px' }}
      >
        <div className="d-flex flex-column align-items-center mb-4">
          <div
            className="d-flex align-items-center justify-content-center mb-2"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'var(--color-primary)',
            }}
          >
            <UtensilsCrossed size={28} color="#ffffff" />
          </div>
          <h4 className="mb-0" style={{ color: 'var(--color-text)', fontWeight: 700 }}>
            TSI Facturación
          </h4>
          <span className="app-text-secondary" style={{ fontSize: '0.85rem' }}>
            Inicia sesión para continuar
          </span>
        </div>

        {error && <Alert variant="danger" className="py-2">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              Usuario
            </Form.Label>
            <div
              className="d-flex align-items-center px-2"
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-background)',
              }}
            >
              <User size={18} color="var(--color-text-secondary)" />
              <Form.Control
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                className="border-0 bg-transparent shadow-none"
                style={{ color: 'var(--color-text)' }}
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              Contraseña
            </Form.Label>
            <div
              className="d-flex align-items-center px-2"
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-background)',
              }}
            >
              <Lock size={18} color="var(--color-text-secondary)" />
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-0 bg-transparent shadow-none"
                style={{ color: 'var(--color-text)' }}
              />
            </div>
          </Form.Group>

          <Button
            type="submit"
            disabled={cargando}
            className="w-100 d-flex justify-content-center align-items-center gap-2"
            style={{
              backgroundColor: 'var(--color-primary)',
              border: 'none',
              fontWeight: 600,
              padding: '10px',
            }}
          >
            {cargando ? <Spinner size="sm" animation="border" /> : 'Entrar'}
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;