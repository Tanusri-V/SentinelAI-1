import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Overview', icon: '◈' },
  { to: '/dashboard', label: 'Dashboard', icon: '▣' },
  { to: '/alerts', label: 'Alerts', icon: '⚡' },
  { to: '/model', label: 'Model Logic', icon: '⬡' },
]

export default function Layout() {
  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">S</div>
          <div className="brand-text">
            <span className="brand-name">Sentinel</span>
            <span className="brand-sub">Identity Shield</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">Platform</span>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Sentinel v1.0 — Identity Theft Detection Model</p>
        </div>
      </aside>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  )
}
