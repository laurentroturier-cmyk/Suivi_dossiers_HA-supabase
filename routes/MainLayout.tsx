import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AppVersion } from '@/components/AppVersion';
import { 
  Home, 
  FolderOpen, 
  FileText, 
  Download, 
  Upload, 
  Shield,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

/**
 * Layout principal de l'application avec navigation
 */
export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Accueil', path: '/', icon: Home },
    { name: 'Tableau de bord', path: '/dashboard', icon: Home },
    { name: 'Planning Gantt', path: '/gantt', icon: Home },
    { name: 'Projets', path: '/projets', icon: FolderOpen },
    { name: 'Procédures', path: '/procedures', icon: FileText },
    { name: 'Contrats', path: '/contrats', icon: FileText },
    { name: 'Commission', path: '/commission', icon: Shield },
    { name: 'Retraits', path: '/retraits', icon: Download },
    { name: 'Dépôts', path: '/depots', icon: Upload },
    { name: 'AN01', path: '/an01', icon: FileText },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GP</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">GestProjet</h1>
                  <AppVersion className="text-xs text-gray-500" />
                </div>
              </div>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg font-medium text-sm"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </button>
              )}

              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {profile?.email?.[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {profile?.email}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isAdmin ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'
                }`}>
                  {profile?.role}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <nav className="lg:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col gap-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                        isActive(item.path)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};
