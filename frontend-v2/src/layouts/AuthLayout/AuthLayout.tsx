import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:block lg:w-1/2 bg-primary">
        {/* Aquí puedes poner luego una imagen o diseño para la parte izquierda */}
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
