import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="app-layout">
      <main className="main-content">
        <Outlet />
      </main>

      {/* Sidebar / Bottom Nav Container */}
      <div className="sidebar-container">
        <Sidebar onMenuClick={() => {}} />
      </div>
    </div>
  );
};

export default Layout;
