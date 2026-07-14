import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Receipt } from 'lucide-react';

const Sidebar = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="stat-icon" style={{ width: '2rem', height: '2rem' }}>
          <Users size={18} />
        </div>
        <h2>MDTA HM</h2>
      </div>
      
      <nav className="nav-links">
        <NavLink 
          to="/" 
          onClick={onMenuClick}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/siswa" 
          onClick={onMenuClick}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>Data Siswa</span>
        </NavLink>
        
        <NavLink 
          to="/siswa-nonaktif" 
          onClick={onMenuClick}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Users size={20} color="var(--text-muted)" />
          <span>Siswa Nonaktif</span>
        </NavLink>
        
        <NavLink 
          to="/tarif" 
          onClick={onMenuClick}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Receipt size={20} />
          <span>Master Tarif</span>
        </NavLink>
        
        <NavLink 
          to="/kasir" 
          onClick={onMenuClick}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Receipt size={20} />
          <span>Kasir / Pembayaran</span>
        </NavLink>


      </nav>
    </aside>
  );
};

export default Sidebar;
