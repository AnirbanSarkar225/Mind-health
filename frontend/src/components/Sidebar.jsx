import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiActivity, FiClipboard, FiClock, FiUser, FiLogOut } from 'react-icons/fi';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: FiHome },
  { to: '/hardware', label: 'Hardware & Analysis', icon: FiActivity },
  { to: '/assessment', label: 'Self-Assessment', icon: FiClipboard },
  { to: '/history', label: 'Session History', icon: FiClock },
  { to: '/account', label: 'My Account', icon: FiUser },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h3>Gita-NeuroSync</h3>
        <p>Chikitsa-Lite · AI Biosignal Remediation</p>
      </div>

      <div className="sidebar-user">
        User: <strong style={{color:'var(--text-primary)'}}>{user?.username || 'User'}</strong>
      </div>

      <div className="section-label">NAVIGATION</div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'active' : ''}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-signout">
        <button className="btn btn-secondary btn-block btn-sm" onClick={handleLogout}>
          <FiLogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
