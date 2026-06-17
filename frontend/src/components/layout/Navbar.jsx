import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BsNavbar, Nav, Container, Button } from 'react-bootstrap';
import { Home, ConciergeBell , HandCoins , LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';

const Navbar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
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
      expand="lg"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <Container fluid>
        <BsNavbar.Brand as={Link} to="/" style={{ color: 'var(--color-text)'}}>
          Truchas San Ignacio
        </BsNavbar.Brand>

        <BsNavbar.Toggle aria-controls="navbar-principal" />

        <BsNavbar.Collapse id="navbar-principal">
          <Nav className="me-auto gap-2">
            <Nav.Link as={Link} to="/inicio" style={linkStyle}>
              Inicio
            </Nav.Link>
            <Nav.Link as={Link} to="/mesas" style={linkStyle}>
               Mesas
            </Nav.Link>
            <Nav.Link as={Link} to="/cierre" style={linkStyle}>
               Cierre
            </Nav.Link>
          </Nav>

          <div className="d-flex align-items-center gap-2">
            <ThemeToggle />
            {usuario && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleLogout}
                className="d-flex align-items-center gap-1"
              >
                <LogOut size={16} />
              </Button>
            )}
          </div>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
};

export default Navbar;