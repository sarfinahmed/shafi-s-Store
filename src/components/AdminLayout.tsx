import React from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useConfig } from "../lib/config";
import { LogOut, Home, Settings, Package, Users, Wallet, ShoppingCart, History, LayoutDashboard } from "lucide-react";
import { Button } from "./ui";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { settings } = useConfig();
  const location = useLocation();

  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-zinc-800 selection:text-white overflow-x-hidden w-full pb-20 md:pb-0">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-black/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl md:text-2xl font-black tracking-tighter text-white flex items-center gap-2 md:gap-3">
              {settings?.appName || "Admin"}
              <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded uppercase tracking-widest font-black ml-1">Admin</span>
            </Link>
          </div>
          
          <nav className="hidden lg:flex items-center gap-2 font-semibold overflow-x-auto whitespace-nowrap">
            <Link to="/admin">
              <Button variant="ghost" size="sm" className={`px-3 ${isActive('/admin') ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
                <Package className="w-4 h-4 mr-2" />
                Products
              </Button>
            </Link>
            <Link to="/admin/users">
              <Button variant="ghost" size="sm" className={`px-3 ${isActive('/admin/users') ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
                <Users className="w-4 h-4 mr-2" />
                Users
              </Button>
            </Link>
            <Link to="/admin/deposits">
              <Button variant="ghost" size="sm" className={`px-3 ${isActive('/admin/deposits') ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
                <Wallet className="w-4 h-4 mr-2" />
                Deposits
              </Button>
            </Link>
            <Link to="/admin/orders">
              <Button variant="ghost" size="sm" className={`px-3 ${isActive('/admin/orders') ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Orders
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="ghost" size="sm" className={`px-3 ${isActive('/admin/settings') ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="hidden md:flex text-zinc-400 border-zinc-800 hover:text-white">
                <Home className="w-4 h-4 mr-2" />
                App
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout} className="text-red-500 hover:bg-red-950/30">
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Secondary Subnav for Tablet/Mobile overflow */}
        <div className="lg:hidden border-t border-zinc-900/50 bg-[#050505] overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 px-4 py-2 min-w-max mx-auto">
             {[
               { path: '/admin', icon: Package, label: 'Products' },
               { path: '/admin/users', icon: Users, label: 'Users' },
               { path: '/admin/deposits', icon: Wallet, label: 'Deposits' },
               { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
               { path: '/admin/settings', icon: Settings, label: 'Settings' },
               { path: '/admin/transactions', icon: History, label: 'History' }
             ].map((item) => (
               <Link key={item.path} to={item.path}>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className={`px-3 h-8 text-[10px] font-black uppercase tracking-widest ${isActive(item.path) ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >
                   <item.icon className="w-3 h-3 mr-1.5" />
                   {item.label}
                 </Button>
               </Link>
             ))}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <Outlet />
      </main>

      {/* Admin Quick Action Footer for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-black/95 backdrop-blur-xl border-t border-red-900/20 z-50 flex items-center justify-around py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-[0_-10px_30px_rgba(220,38,38,0.05)]">
        <Link to="/" className="flex flex-col items-center gap-1 text-zinc-500">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">App</span>
        </Link>
        <Link to="/admin" className={`flex flex-col items-center gap-1 ${isActive('/admin') ? 'text-white' : 'text-zinc-500'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold">Dashboard</span>
        </Link>
        <Link to="/admin/orders" className={`flex flex-col items-center gap-1 ${isActive('/admin/orders') ? 'text-white' : 'text-zinc-500'}`}>
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] font-bold">Orders</span>
        </Link>
        <Link to="/admin/users" className={`flex flex-col items-center gap-1 ${isActive('/admin/users') ? 'text-white' : 'text-zinc-500'}`}>
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold">Users</span>
        </Link>
      </nav>
    </div>
  );
}
