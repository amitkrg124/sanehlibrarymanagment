import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen, HelpCircle, Settings, Menu, X, Search, Bell, LogOut,
  LayoutDashboard, Armchair, Users, ClipboardList, Wallet, BarChart3
} from 'lucide-react';
import { useAuthStore, useAppStore, useLibraryStore } from '../../store';
import { format } from 'date-fns';

const NAV_ITEMS = [
  { to: '/', label: 'Floor Map & Desk' },
  { to: '/students', label: 'Students' },
  { to: '/fees', label: 'Fees Register' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/reports', label: 'Analytics' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const libraryName = useLibraryStore((s) => s.settings.libraryName);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans">
      {/* Premium Top Navigation Bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <Link to="/" className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden bg-white">
              <img src="/logo.jpg" alt="Saneh Library Logo" className="w-full h-full object-cover" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">Saneh Library</span>
                <span className="bg-[#fcf3eb] text-[#8c3d19] border border-[#f5dcd0] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  30 DESKS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                स्नेह लाइब्रेरी - A Peaceful Space for Serious Aspirants
              </p>
            </div>
          </div>

          {/* Center: Navigation Pills (Desktop Only) */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Quick Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Find Seat Action Button */}
            <button
              onClick={() => navigate('/')}
              className="bg-[#8c3d19] hover:bg-[#723113] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Search size={14} />
              Find Seat
            </button>

            {/* Help Icon */}
            <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg" title="Help">
              <HelpCircle size={20} />
            </button>

            {/* Settings Link */}
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `p-1.5 rounded-lg transition-colors ${
                  isActive ? 'text-[#8c3d19] bg-[#fcf3eb]' : 'text-slate-400 hover:text-slate-600'
                }`
              }
              title="Settings"
            >
              <Settings size={20} />
            </NavLink>

            {/* Logout button */}
            <button
              onClick={logout}
              className="text-red-400 hover:text-red-600 p-1.5 rounded-lg ml-1"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => navigate('/')}
              className="bg-[#8c3d19] text-white p-2 rounded-xl"
              title="Find Seat"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 p-2 rounded-xl border border-slate-100 hover:bg-slate-50"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-30 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-40 lg:hidden p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-extrabold text-slate-900 text-md">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-500">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-[#fcf3eb] text-[#8c3d19]'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                
                <NavLink
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                      isActive ? 'bg-[#fcf3eb] text-[#8c3d19]' : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  Settings
                </NavLink>
              </div>

              <button
                onClick={logout}
                className="w-full py-3 border border-red-100 text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Page Content Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Premium Footer */}
      <footer className="bg-white border-t border-slate-100 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <p className="font-semibold text-slate-500">Saneh Library · <span className="font-normal text-slate-400">30 Desks Dedicated Study Center</span></p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> Afternoon (7 AM - 2 PM)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Evening (2 PM - 9 PM)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Full Day (7 AM - 9 PM)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
