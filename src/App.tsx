/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { ConfigProvider } from "./lib/config";
import { db } from "./lib/db";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/AdminLayout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Profile } from "./pages/Profile";
import { ProductDetail } from "./pages/ProductDetail";
import { Admin } from "./pages/Admin";
import { AdminSettings } from "./pages/AdminSettings";
import { AdminUsers } from "./pages/AdminUsers";
import { AdminDeposits } from "./pages/AdminDeposits";
import { AdminOrders } from "./pages/AdminOrders";
import { AdminTransactions } from "./pages/AdminTransactions";
import { Contact } from "./pages/Contact";
import { GlobalMaintenance } from "./components/GlobalMaintenance";

// Simple wrapper to ensure users only
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!user || (!user.isAdmin)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PageViewTracker() {
  useEffect(() => {
    // Record page view once per session per refresh
    const hasRecorded = sessionStorage.getItem('page_view_recorded');
    if (!hasRecorded) {
      db.recordPageView().then(() => {
        sessionStorage.setItem('page_view_recorded', 'true');
      });
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <BrowserRouter>
          <PageViewTracker />
          <GlobalMaintenance />
          <Routes>
            {/* User App Routes */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route 
                path="/profile" 
                element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                } 
              />
            </Route>

            {/* Admin App Routes */}
            <Route 
              path="/admin" 
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<Admin />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="deposits" element={<AdminDeposits />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="transactions" element={<AdminTransactions />} />
            </Route>

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
