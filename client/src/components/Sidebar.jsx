import React from 'react';
import { NavLink } from 'react-router-dom';
import { Network, LayoutDashboard, PackageSearch, BarChart3, Settings } from 'lucide-react';

const Sidebar = () => {
  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/shipments', icon: PackageSearch, label: 'Shipments' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-full md:w-64 h-auto md:h-screen fixed bottom-0 md:bottom-auto md:top-0 left-0 bg-blue-900 border-t-4 md:border-t-0 md:border-r-4 border-blue-700 flex flex-row md:flex-col z-50 shadow-[0_-4px_20px_rgba(23,37,84,0.3)] md:shadow-2xl md:shadow-blue-950/40">
      {/* Brand Header */}
      <div className="hidden md:flex h-20 items-center gap-3 px-6 border-b-2 border-blue-700/60 bg-blue-950">
        <img src="/ai_logo.png" alt="DelayShield AI Logo" className="w-10 h-10 object-contain rounded-lg shadow-lg ring-2 ring-blue-500/30 bg-[#151c2c]" />
        <div className="flex flex-col">
          <span className="text-lg font-black text-white tracking-widest uppercase leading-tight">
            Delay<span className="text-blue-300">Shield</span>
          </span>
          <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">Decision Engine</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-row md:flex-col justify-around md:justify-start px-2 py-2 md:px-3 md:py-6 space-x-1 md:space-x-0 md:space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `
              flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl font-semibold transition-all duration-200
              ${isActive
                ? 'bg-white text-blue-800 shadow-md shadow-blue-950/30'
                : 'text-blue-200 hover:bg-blue-800 hover:text-white'}
            `}
          >
            <link.icon className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-[10px] md:text-sm">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="hidden md:block p-4 border-t-2 border-blue-700/60">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-800/60 hover:bg-blue-800 cursor-pointer transition-colors border border-blue-700/50">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-black text-xs shadow">AU</div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Admin User</p>
            <p className="text-xs text-blue-300">Logistics Corp.</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
