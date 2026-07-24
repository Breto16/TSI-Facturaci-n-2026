import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BsNavbar, Nav, Container, Button } from 'react-bootstrap';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';

const NAV_LINKS = [
  { to: '/inicio', label: 'Inicio' },
  { to: '/mesas', label: 'Mesas' },
  { to: '/validacion', label: 'Validación' },
  { to: '/cierre', label: 'Cierre' },
];

const Navbar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const linkStyle = {
    color: 'var(--color-text)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  return (
    <BsNavbar
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes navbar-menu-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Container fluid className="d-flex align-items-center flex-nowrap gap-2">
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="d-lg-none btn btn-sm"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: '4px 8px',
          }}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <BsNavbar.Brand
          as={Link}
          to="/"
          style={{ color: 'var(--color-text)', margin: 0, whiteSpace: 'nowrap' }}
        >
          Truchas San Ignacio
        </BsNavbar.Brand>

        <Nav className="d-none d-lg-flex gap-2">
          {NAV_LINKS.map((link) => (
            <Nav.Link key={link.to} as={Link} to={link.to} style={linkStyle}>
              {link.label}
            </Nav.Link>
          ))}
        </Nav>

        <div className="ms-auto d-flex align-items-center gap-2">
          <ThemeToggle />

          {usuario && (
            <div className="d-none d-lg-flex align-items-center gap-2">
              <div
                style={{
                  width: 1,
                  height: 22,
                  backgroundColor: 'var(--color-border)',
                }}
              />
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleLogout}
                className="d-flex align-items-center gap-1"
              >
                <LogOut size={16} />
              </Button>
            </div>
          )}
        </div>
      </Container>

      {menuOpen && (
        <div
          className="d-lg-none"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 999,
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            padding: '8px 16px 12px',
            transformOrigin: 'top',
            animation: 'navbar-menu-in 160ms ease',
          }}
        >
          <Nav className="flex-column gap-1">
            {NAV_LINKS.map((link) => (
              <Nav.Link
                key={link.to}
                as={Link}
                to={link.to}
                style={linkStyle}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Nav.Link>
            ))}
          </Nav>

          {usuario && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleLogout}
              className="d-flex align-items-center gap-1 mt-2"
            >
              <LogOut size={16} />
              Cerrar sesión
            </Button>
          )}
        </div>
      )}
    </BsNavbar>
  );
};

export default Navbar;