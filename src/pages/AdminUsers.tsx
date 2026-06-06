import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { db, User } from "../lib/db";
import { Button, Input } from "../components/ui";
import { Trash2, CheckCircle, ShieldAlert, Shield, Ban, Unlock, Search as SearchIcon, Plus, Minus } from "lucide-react";

export function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");
  const [adjustUserId, setAdjustUserId] = useState<string | null>(null);
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

  const handleToggleBan = async (id: string, currentStatus: boolean) => {
    await db.updateUser(id, { isBanned: !currentStatus });
    notify(currentStatus ? "User unbanned" : "User banned");
    loadData();
  };

  const handleToggleAdmin = async (id: string, currentStatus: boolean) => {
    await db.updateUser(id, { isAdmin: !currentStatus });
    notify(currentStatus ? "Admin rights revoked" : "User is now an admin");
    loadData();
  };

  const handleAdjustBalance = async (u: User, action: 'add' | 'deduct') => {
    let amt = parseFloat(balanceAmount);
    if (!amt || amt <= 0 || !balanceReason) {
      alert("Please enter a valid positive amount and a reason");
      return;
    }
    
    const change = action === 'add' ? amt : -amt;
    const newBalance = (u.balance || 0) + change;
    
    await db.updateUser(u.id, { balance: newBalance });
    await db.logTransaction(u.id, amt, action === 'add' ? "deposit" : "purchase", `Admin ${action}: ${balanceReason}`);
    
    setAdjustUserId(null);
    setBalanceAmount("");
    setBalanceReason("");
    notify(`Balance updated for ${u.email}`);
    loadData();
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-12 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Users</h1>
          <p className="text-zinc-500 mt-1 font-medium">Manage platform accounts.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <Input 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#111] border-zinc-800"
            />
          </div>
          {notification && (
            <div className="flex items-center text-green-400 bg-green-950/30 border border-green-900/50 px-4 py-2 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="w-5 h-5 mr-2" />
              {notification}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Total ({filteredUsers.length} of {users.length})</h2>
        <div className="bg-[#0a0a0a] rounded-3xl border border-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase bg-[#111] text-zinc-500 font-black tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-medium">No users found.</td>
                  </tr>
                ) : filteredUsers.map((u) => (
                  <React.Fragment key={u.id}>
                  <tr className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#111] overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white border border-zinc-800">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-bold text-white truncate max-w-[150px]">{u.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-500">{u.email}</td>
                    <td className="px-6 py-4 font-bold text-white">৳{(u.balance || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {u.isAdmin ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-white text-black">
                          Admin
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#111] text-zinc-500 border border-zinc-800">
                            User
                          </span>
                          {u.isBanned && (
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-950 text-red-500 border border-red-900/50">
                               Banned
                             </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => setAdjustUserId(adjustUserId === u.id ? null : u.id)} 
                             className="text-zinc-500 hover:text-white hover:bg-zinc-800 w-10 h-10 p-0 rounded-xl"
                             title="Adjust Balance"
                           >
                             {adjustUserId === u.id ? <Minus className="w-5 h-5 mx-auto" /> : <Plus className="w-5 h-5 mx-auto" />}
                           </Button>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => handleToggleBan(u.id, !!u.isBanned)} 
                             className={`w-10 h-10 p-0 rounded-xl ${u.isBanned ? 'text-green-500 hover:text-green-400 hover:bg-green-950/30' : 'text-amber-500 hover:text-amber-400 hover:bg-amber-950/30'}`}
                             title={u.isBanned ? "Unban User" : "Ban User"}
                           >
                             {u.isBanned ? <Unlock className="w-5 h-5 mx-auto" /> : <Ban className="w-5 h-5 mx-auto" />}
                           </Button>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => handleToggleAdmin(u.id, !!u.isAdmin)} 
                             className={`w-10 h-10 p-0 rounded-xl ${u.isAdmin ? 'text-amber-500 hover:text-amber-400 hover:bg-amber-950/30' : 'text-blue-500 hover:text-blue-400 hover:bg-blue-950/30'}`}
                             title={u.isAdmin ? "Remove Admin" : "Make Admin"}
                           >
                             {u.isAdmin ? <ShieldAlert className="w-5 h-5 mx-auto" /> : <Shield className="w-5 h-5 mx-auto" />}
                           </Button>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => handleDeleteUser(u.id)} 
                             className="text-red-500 hover:text-red-400 hover:bg-red-950/30 w-10 h-10 p-0 rounded-xl"
                             title="Delete User"
                           >
                             <Trash2 className="w-5 h-5 mx-auto" />
                           </Button>
                        </div>
                    </td>
                  </tr>
                  {adjustUserId === u.id && (
                  <tr key={`${u.id}-adjust`} className="bg-[#111] animate-in fade-in slide-in-from-top-1">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="flex flex-col md:flex-row items-end gap-3 max-w-2xl ml-auto">
                        <div className="flex-1 w-full space-y-1">
                          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Amount</label>
                          <Input 
                            type="number" 
                            placeholder="e.g. 500" 
                            className="bg-black border-zinc-900"
                            value={balanceAmount}
                            onChange={e => setBalanceAmount(e.target.value)}
                          />
                        </div>
                        <div className="flex-1 w-full space-y-1">
                          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-1">Reason</label>
                          <Input 
                            placeholder="e.g. Deposit or Penalty" 
                            className="bg-black border-zinc-900"
                            value={balanceReason}
                            onChange={e => setBalanceReason(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button onClick={() => handleAdjustBalance(u, 'add')} size="sm" className="bg-green-600 hover:bg-green-700 text-white">Add (+)</Button>
                          <Button onClick={() => handleAdjustBalance(u, 'deduct')} size="sm" className="bg-red-600 hover:bg-red-700 text-white">Deduct (-)</Button>
                          <Button variant="ghost" size="sm" onClick={() => setAdjustUserId(null)}>Cancel</Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
