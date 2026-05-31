import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { db, User } from "../lib/db";
import { Button } from "../components/ui";
import { Trash2, CheckCircle } from "lucide-react";

export function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [notification, setNotification] = useState("");

  const loadData = async () => {
    const u = await db.getAllUsers();
    setUsers(u);
  };

  useEffect(() => {
    if (user?.isAdmin) {
      loadData();
    }
  }, [user]);

  if (!user?.isAdmin) {
    return <div className="text-center py-20 text-red-500 font-medium">Access Denied. Admins only.</div>;
  }

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleDeleteUser = async (id: string) => {
    await db.deleteUser(id);
    notify("User removed");
    loadData();
  };

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-12 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Users</h1>
          <p className="text-zinc-500 mt-1 font-medium">Manage platform accounts.</p>
        </div>
        {notification && (
          <div className="flex items-center text-green-400 bg-green-950/30 border border-green-900/50 px-4 py-2 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 mr-2" />
            {notification}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Total ({users.length})</h2>
        <div className="bg-[#0a0a0a] rounded-3xl border border-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase bg-[#111] text-zinc-500 font-black tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#111] overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white border border-zinc-800">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-bold text-white truncate max-w-[150px]">{u.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-500">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.isAdmin ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-white text-black">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#111] text-zinc-500 border border-zinc-800">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!u.isAdmin && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-400 hover:bg-red-950/30 w-10 h-10 p-0 rounded-xl">
                          <Trash2 className="w-5 h-5 mx-auto" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
