import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '◻' },
  { to: '/upload', label: 'Upload CSV', icon: '↗' },
  { to: '/reports', label: 'Rapports', icon: '◼' },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-56 bg-white border-r border-[#E8E0D6] min-h-screen">
      <div className="px-5 py-7 border-b border-[#F0EBE3]">
        <div className="flex items-center gap-3">
          <img src="/logo-kilani.png" alt="Kilani Groupe" className="h-7 w-auto" />
          <div>
            <h1 className="text-sm font-semibold text-[#3D3D3D]">Finance AI</h1>
            <p className="text-[10px] text-[#A89F94]">Automatisation</p>
          </div>
        </div>
      </div>
      <nav className="p-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-[#FAF7F5] text-[#C4956A] font-medium'
                  : 'text-[#A89F94] hover:text-[#3D3D3D] hover:bg-[#FAF7F5]'
              }`
            }
          >
            <span className="text-sm">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
