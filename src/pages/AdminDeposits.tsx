import React, { useEffect, useState, useMemo } from "react";
import { db, DepositRequest } from "../lib/db";
import { useConfig } from "../lib/config";
import { Button, Input } from "../components/ui";
import { CheckCircle, XCircle, Search } from "lucide-react";

export function AdminDeposits() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const { settings } = useConfig();
  const [notification, setNotification] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = db.subscribeToDepositRequests((d) => {
      setDeposits(d);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    try {
      await db.updateDepositRequestStatus(id, action);
      setNotification(`Deposit request ${action} successfully.`);
      setTimeout(() => setNotification(""), 3000);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const filteredDeposits = useMemo(() => {
    return deposits.filter(d => {
      const matchesSearch = 
        d.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.trxId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [deposits, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Deposits</h1>
          <p className="text-zinc-500 mt-1 font-medium">Manage user deposit requests.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
          <select 
            value={statusFilter} 
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-[#111] border border-zinc-800 text-zinc-300 text-sm rounded-xl px-3 py-2 w-full md:w-auto outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="relative flex-1 md:w-64 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <Input 
              placeholder="Search by name, email or TrxID..." 
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
        <h2 className="text-xl font-bold text-white">Total Requests ({filteredDeposits.length} of {deposits.length})</h2>
        <div className="bg-[#0a0a0a] rounded-3xl border border-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase bg-[#111] text-zinc-500 font-black tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Bkash TrxID</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {filteredDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-bold">No deposit requests match your filters.</td>
                  </tr>
                ) : filteredDeposits.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white truncate max-w-[150px]">{d.userName}</div>
                      <div className="text-xs text-zinc-500 mt-0.5 truncate">{d.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 font-black tracking-tight text-white">{settings?.currencySymbol || "৳"}{d.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-500">{d.trxId}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest ${
                        d.status === 'approved' ? 'bg-green-950 text-green-500' : 
                        d.status === 'rejected' ? 'bg-red-950 text-red-500' : 
                        'bg-amber-950 text-amber-500'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {d.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleAction(d.id, 'approved')} className="text-green-500 hover:text-green-400 hover:bg-green-950/30 h-8 px-3 rounded-lg text-xs">
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleAction(d.id, 'rejected')} className="text-red-500 hover:text-red-400 hover:bg-red-950/30 h-8 px-3 rounded-lg text-xs">
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {deposits.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-bold">No deposit requests yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
