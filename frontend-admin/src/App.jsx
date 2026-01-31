import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, Flag, Settings, CheckCircle, X, CalendarClock, ShieldAlert, ChevronLeft, MessageSquare, Megaphone, TrendingUp, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import api from './services/api';
import './index.css';

// Component Imports
import Dashboard from './components/Dashboard';
import TournamentManagement from './components/TournamentManagement';
import ResultsSubmission from './components/ResultsSubmission';
import SquadManagement from './components/SquadManagement';
import PlayerManagement from './components/PlayerManagement';
import Verification from './components/Verification';
import SeasonControl from './components/SeasonControl';
import Broadcast from './components/Broadcast';
import GlobalMatches from './components/GlobalMatches';
import AnnouncementManager from './components/AnnouncementManager';
import DisputeBureau from './components/DisputeBureau';
import CommandAnalytics from './components/CommandAnalytics';
import CasterHUD from './components/CasterHUD';

// Add Google Fonts
const style = document.createElement('style');
style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');`;
document.head.appendChild(style);

const API_URL = 'http://localhost:5001/api';

const NavLink = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
      <Icon size={20} /> {label}
    </Link>
  );
};

const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      onLoginSuccess(res.data.token);
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0A0A0B 0%, #141416 100%)'
    }}>
      <div className="card glass-panel" style={{ width: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="Quadra Logo" style={{ width: '80px', height: '80px', marginBottom: '16px', filter: 'drop-shadow(0 0 10px var(--primary))' }} />
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', margin: 0 }}>
            QUADRA
          </h1>
          <span style={{ fontSize: '0.8rem', letterSpacing: '6px', color: 'var(--text-dim)', display: 'block' }}>ADMIN</span>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@quadra.com"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label className="text-dim" style={{ fontSize: '10px', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '16px' }}
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM'}
          </button>
        </form>
      </div>
    </div>
  );
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));

  if (!token) {
    return <AdminLogin onLoginSuccess={setToken} />;
  }

  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <nav className="sidebar">
          <div className="sidebar-logo">
            <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', marginBottom: '12px', filter: 'drop-shadow(0 0 5px var(--primary))' }} />
            <div className="gradient-text">
              QUADRA<br />
              <span style={{ fontSize: '0.6rem', letterSpacing: '4px', color: 'var(--text-dim)' }}>ADMIN</span>
            </div>
          </div>

          <NavLink to="/" icon={LayoutDashboard} label="Overview" />
          <NavLink to="/tournaments" icon={Trophy} label="Arenas" />
          <NavLink to="/results" icon={CheckCircle} label="Results" />
          <NavLink to="/matches" icon={Flag} label="Schedule" />
          <NavLink to="/squads" icon={ShieldAlert} label="Squads" />
          <NavLink to="/players" icon={Users} label="Athletes" />
          <NavLink to="/verification" icon={Settings} label="Verification" />
          <NavLink to="/seasons" icon={CalendarClock} label="Seasons" />
          <NavLink to="/feed" icon={Megaphone} label="Feed Control" />
          <NavLink to="/disputes" icon={ShieldAlert} label="Conflicts" />
          <NavLink to="/comms" icon={MessageSquare} label="Broadcast" />
          <NavLink to="/analytics" icon={TrendingUp} label="Intelligence" />

          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              window.location.reload();
            }}
            style={{
              marginTop: 'auto',
              flexShrink: 0,
              background: 'rgba(255, 68, 68, 0.1)',
              color: '#ff4444',
              border: '1px solid rgba(255, 68, 68, 0.2)',
              padding: '16px',
              borderRadius: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontWeight: '600',
              marginBottom: '20px'
            }}
          >
            <X size={18} /> TERMINATE SESSION
          </button>
        </nav>

        <main className="main-content" style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tournaments" element={<TournamentManagement />} />
            <Route path="/results" element={<ResultsSubmission />} />
            <Route path="/matches" element={<GlobalMatches />} />
            <Route path="/squads" element={<SquadManagement />} />
            <Route path="/players" element={<PlayerManagement />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/seasons" element={<SeasonControl />} />
            <Route path="/feed" element={<AnnouncementManager />} />
            <Route path="/disputes" element={<DisputeBureau />} />
            <Route path="/comms" element={<Broadcast />} />
            <Route path="/analytics" element={<CommandAnalytics />} />
            <Route path="/caster/:matchId" element={<CasterHUD />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
