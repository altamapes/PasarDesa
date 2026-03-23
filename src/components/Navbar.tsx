import { Link } from 'react-router-dom';
import { Store, User, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, sellerProfile, isAdmin, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 text-emerald-600">
            <Store className="h-6 w-6" />
            <span className="font-bold text-xl">PasarDesa</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/kurir" className="text-gray-600 hover:text-emerald-600 font-medium">
              Kurir
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center space-x-1 text-red-600 hover:text-red-700 font-medium bg-red-50 px-3 py-1.5 rounded-lg">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link to="/dashboard" className="text-gray-600 hover:text-emerald-600 font-medium">
                  Toko Saya
                </Link>
                <div className="flex items-center space-x-2 text-sm text-gray-500 border-l pl-4">
                  <User className="h-4 w-4" />
                  <span>{sellerProfile?.name || user.displayName}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Keluar"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Masuk Penjual
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
