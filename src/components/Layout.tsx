import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useConfig } from "../lib/config";
import { LogOut, User as UserIcon, LayoutDashboard, Home, MessageSquare, HelpCircle } from "lucide-react";
import { Button } from "./ui";

export function Layout() {
  const { user, logout } = useAuth();
  const { settings } = useConfig();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-zinc-800 selection:text-white overflow-x-hidden w-full pb-20 md:pb-0">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-black/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <Link to="/" className="text-xl md:text-2xl font-black tracking-tighter text-white flex items-center gap-2 md:gap-3">
            {settings?.appName || "Loading..."}
          </Link>

          <nav className="hidden md:flex items-center gap-4 font-semibold">
            <Link to="/">
              <Button variant="ghost" className={`px-4 ${isActive('/') ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
                <Home className="w-4 h-4 mr-2" />
                <span>Home</span>
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost" className={`px-4 ${isActive('/contact') ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
                Contact
              </Button>
            </Link>
            <Link to="/tutorial">
              <Button variant="ghost" className={`px-4 ${isActive('/tutorial') ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
                Tutorial
              </Button>
            </Link>
            {user ? (
              <>
                <Link to="/profile">
                  <Button variant="ghost" className={`px-4 ${isActive('/profile') ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
                    <UserIcon className="w-4 h-4 mr-2" />
                    <span>Profile</span>
                  </Button>
                </Link>
                {user.isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" className={`px-4 ${isActive('/admin') ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      <span>Admin</span>
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" onClick={logout} className="px-4 text-zinc-500 hover:text-red-400 hover:bg-red-950/30">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <Link to="/login?register=true">
                <Button className="bg-white text-black hover:bg-zinc-200 px-4 py-2 text-sm">Create Account</Button>
              </Link>
            )}
          </nav>

          {/* Mobile Right Action (Login/Logout) */}
          <div className="flex md:hidden items-center">
            {user ? (
               <Button variant="ghost" onClick={logout} className="px-2 text-zinc-500 hover:text-red-400">
                 <LogOut className="w-5 h-5" />
               </Button>
            ) : (
               <Link to="/login">
                 <Button className="bg-white text-black hover:bg-zinc-200 px-3 py-1.5 text-xs font-bold">Login</Button>
               </Link>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <Outlet />
      </main>
      
      <footer className="border-t border-zinc-900 bg-black text-center py-6 md:py-8 text-xs md:text-sm text-zinc-500 font-medium hidden md:block">
        © {new Date().getFullYear()} {settings?.appName || "Loading..."}. All rights reserved.
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-black/95 backdrop-blur-xl border-t border-zinc-900 z-50 flex items-center justify-around py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link to="/tutorial" className={`flex flex-col items-center gap-1 ${isActive('/tutorial') ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <HelpCircle className="w-5 h-5" />
          <span className="text-[10px] font-bold">Tutorial</span>
        </Link>
        {user ? (
          <Link to="/profile" className={`flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold">Profile</span>
          </Link>
        ) : (
          <Link to="/login?register=true" className={`flex flex-col items-center gap-1 ${isActive('/login') ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold">Account</span>
          </Link>
        )}
        {user?.isAdmin ? (
          <Link to="/admin" className={`flex flex-col items-center gap-1 ${isActive('/admin') ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold">Admin</span>
          </Link>
        ) : (
          <Link to="/contact" className={`flex flex-col items-center gap-1 ${isActive('/contact') ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-bold">Contact</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
