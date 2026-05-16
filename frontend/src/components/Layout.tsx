import { Link, Outlet, useNavigate } from 'react-router-dom';
import { clearToken } from '../api/client';
import { Shield, LayoutDashboard, Package, FileText, LogOut } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();

  const logout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-white no-underline">
            <Shield className="w-6 h-6 text-emerald-400" />
            Canopy
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
          <NavLink to="/packages" icon={<Package className="w-4 h-4" />} label="Packages" />
          <NavLink to="/audit" icon={<FileText className="w-4 h-4" />} label="Audit Log" />
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors no-underline">
      {icon}
      {label}
    </Link>
  );
}
