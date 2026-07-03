import { Outlet } from 'react-router-dom';

export function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-8 text-primary">SGA - Sistema</h2>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li><a href="/" className="text-gray-600 hover:text-gray-900 block p-2 rounded hover:bg-gray-50">Dashboard</a></li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
