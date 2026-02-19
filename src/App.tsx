import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ByTown from './pages/ByTown';
import ByType from './pages/ByType';

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">NNDR</div>
          <div className="brand-text">
            <div className="brand-title">Rates Explorer</div>
            <div className="brand-subtitle">Business rates intelligence</div>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/" end className="nav-link">
            Dashboard
          </NavLink>
          <NavLink to="/by-town" className="nav-link">
            By Town
          </NavLink>
          <NavLink to="/by-type" className="nav-link">
            By Business Type
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/by-town" element={<ByTown />} />
          <Route path="/by-type" element={<ByType />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <span>NNDR Rates Explorer</span>
        <span className="footer-muted">Client-side analytics</span>
      </footer>
    </div>
  );
}
