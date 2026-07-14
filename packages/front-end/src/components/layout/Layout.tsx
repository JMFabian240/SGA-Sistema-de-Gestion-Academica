import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-slate-50/50">
        <div className="max-w-8xl mx-auto p-8 animate-in fade-in zoom-in-95 duration-300">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
