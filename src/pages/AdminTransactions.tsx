import React, { useEffect, useState } from "react";
import { db, Transaction } from "../lib/db";
import { useConfig } from "../lib/config";
import { Input, Button } from "../components/ui";
import { Search, Download, ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react";

export function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "deposit" | "purchase" | "refund">("all");
  const { settings } = useConfig();

  const loadData = async () => {
    const data = await db.getTransactions();
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.userId.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleExportCSV = () => {
    const headers = ["Date", "User ID", "Type", "Amount", "Description"];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + transactions.map(t => {
          return [
            `"${new Date(t.createdAt).toLocaleString().replace(/"/g, '""')}"`,
            `"${t.userId.replace(/"/g, '""')}"`,
            `"${t.type}"`,
            t.amount,
            `"${t.description.replace(/"/g, '""')}"`
          ].join(",");
        }).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-center py-20 text-zinc-500 font-medium font-sans">Loading transactions...</div>;

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-12 max-w-5xl font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Transactions</h1>
          <p className="text-zinc-500 mt-1 font-medium">Full ledger of all balance activities.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
          <select 
            value={typeFilter} 
            onChange={(e: any) => setTypeFilter(e.target.value)}
            className="bg-[#111] border border-zinc-800 text-zinc-300 text-sm rounded-xl px-3 py-2 w-full md:w-auto outline-none"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="purchase">Purchases</option>
            <option value="refund">Refunds</option>
          </select>
          <div className="relative flex-1 md:w-64 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <Input 
              placeholder="Search by User ID or Reason..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#111] border-zinc-800"
            />
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2 border-zinc-800 text-zinc-300 hover:text-white w-full md:w-auto justify-center">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-[#0a0a0a] rounded-3xl border border-zinc-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase bg-[#111] text-zinc-500 font-black tracking-widest border-b border-zinc-900">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-zinc-300">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 font-medium">No transactions found.</td>
                </tr>
              ) : filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-500 font-mono">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 p-1.5 rounded-lg ${t.type === 'deposit' || t.type === 'refund' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {t.type === 'deposit' || t.type === 'refund' ? <ArrowUpRight className="w-3.5 h-3.5 text-green-500" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-white font-bold truncate max-w-[300px]">{t.description}</div>
                        <div className="text-[10px] text-zinc-500 font-medium truncate uppercase tracking-widest mt-0.5">UID: {t.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${t.type === 'deposit' ? 'bg-green-950 text-green-500' : t.type === 'refund' ? 'bg-blue-950 text-blue-500' : 'bg-red-950 text-red-500'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-black tracking-tight ${t.type === 'deposit' || t.type === 'refund' ? 'text-green-500' : 'text-white'}`}>
                    {t.type === 'deposit' || t.type === 'refund' ? '+' : '-'}{settings?.currencySymbol || "৳"}{t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
