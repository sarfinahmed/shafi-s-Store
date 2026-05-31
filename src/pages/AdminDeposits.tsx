import React, { useEffect, useState } from "react";
import { db, DepositRequest } from "../lib/db";
import { useConfig } from "../lib/config";
import { Button } from "../components/ui";
import { CheckCircle, XCircle } from "lucide-react";

export function AdminDeposits() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const { settings } = useConfig();
  const [notification, setNotification] = useState("");

  const loadDeposits = () => {
    db.getDepositRequests().then(setDeposits);
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    try {
      await db.updateDepositRequestStatus(id, action);
      loadDeposits();
      setNotification(`Deposit request ${action} successfully.`);
      setTimeout(() => setNotification(""), 3000);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-12 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Deposits</h1>
          <p className="text-zinc-500 mt-1 font-medium">Manage user deposit requests.</p>
        </div>
        {notification && (
          <div className="flex items-center text-green-400 bg-green-950/30 border border-green-900/50 px-4 py-2 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 mr-2" />
            {notification}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Total Requests ({deposits.length})</h2>
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
                {deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white truncate max-w-[150px]">{d.userName}</div>
                      <div className="text-xs text-zinc-500 mt-0.5 truncate">{d.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 font-black tracking-tight text-white">{settings?.currencySymbol || "৳"}{d.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">{d.trxId}</td>
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
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-600 font-bold">No deposit requests yet.</td>
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
