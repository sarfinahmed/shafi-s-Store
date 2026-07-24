import React, { useEffect, useState, useMemo } from "react";
import { db, Order } from "../lib/db";
import { useConfig } from "../lib/config";
import { Button, Input } from "../components/ui";
import { Download, Search } from "lucide-react";

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { settings } = useConfig();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "rejected" | "processing" | "success" | "failed">("all");
  const [actionLinkId, setActionLinkId] = useState<string | null>(null);
  const [actionLinkInput, setActionLinkInput] = useState("");

  useEffect(() => {
    const unsub = db.subscribeToOrders((o) => {
      setOrders(o);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (order: Order, status: "completed" | "rejected" | "success" | "failed") => {
    if ((status === "completed" || status === "success") && actionLinkId === order.id) {
      await db.updateOrderStatus(order.id, status, actionLinkInput);
      setActionLinkId(null);
      setActionLinkInput("");
    } else {
      await db.updateOrderStatus(order.id, status);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Date", "User Email", "Product", "User Input", "Price", "Status", "Delivery Link"];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + orders.map(o => {
          return [
            `"${new Date(o.createdAt).toLocaleString().replace(/"/g, '""')}"`,
            `"${o.userEmail.replace(/"/g, '""')}"`,
            `"${o.productTitle.replace(/"/g, '""')}"`,
            `"${(o.userInput || "").replace(/"/g, '""')}"`,
            o.price,
            `"${o.status || 'completed'}"`,
            `"${(o.deliveryLink || "").replace(/"/g, '""')}"`
          ].join(",");
        }).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        o.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.userInput || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || (o.status || "completed") === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Orders</h1>
          <p className="text-zinc-500 mt-1 font-medium">History of all user purchases.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
          <select 
            value={statusFilter} 
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-[#111] border border-zinc-800 text-zinc-300 text-sm rounded-xl px-3 py-2 w-full md:w-auto outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="processing">Processing</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <div className="relative flex-1 md:w-64 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <Input 
              placeholder="Search orders..." 
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
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">User Input</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-zinc-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-medium">No orders found.</td>
                </tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{order.userEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">
                      {order.productTitle}
                      {order.selectedOptionName && <span className="text-zinc-500 font-medium ml-2">({order.selectedOptionName})</span>}
                    </div>
                    {order.deliveredCode && (
                      <div className="text-[10px] font-mono text-green-400 bg-green-950/30 px-1 py-0.5 rounded mt-1 inline-block border border-green-900/50">
                        Code: {order.deliveredCode}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {order.userInput || <span className="text-zinc-500 italic">None</span>}
                  </td>
                  <td className="px-6 py-4 font-black tracking-tight text-white text-right">
                    {order.price !== undefined && order.price !== null ? `${settings?.currencySymbol || "৳"}${order.price.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-widest ${
                      (order.status === 'completed' || order.status === 'success' || !order.status) ? 'bg-green-950 text-green-500' : 
                      (order.status === 'rejected' || order.status === 'failed') ? 'bg-red-950 text-red-500' : 'bg-amber-950 text-amber-500'
                    }`}>
                      {order.status || 'completed'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {(order.status === 'pending' || order.status === 'processing' || order.status === 'failed') && (
                      <div className="flex gap-2 min-w-[200px]">
                        {actionLinkId === order.id ? (
                          <div className="flex gap-2 w-full">
                            <Input 
                              placeholder="Delivery Link / MSG" 
                              value={actionLinkInput} 
                              onChange={e => setActionLinkInput(e.target.value)} 
                              className="text-xs h-8 px-2"
                            />
                            <Button size="sm" className="h-8" onClick={() => handleUpdateStatus(order, "success")}>OK</Button>
                          </div>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="text-xs text-green-500 border-green-900 hover:bg-green-950" onClick={() => setActionLinkId(order.id)}>
                              Complete
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs text-red-500 border-red-900 hover:bg-red-950" onClick={() => handleUpdateStatus(order, "failed")}>
                              Fail/Reject
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                    {(order.status === 'completed' || order.status === 'success' || !order.status) && order.deliveryLink && (
                       <a href={order.deliveryLink} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 hover:text-white underline">View Link</a>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-bold">No orders yet.</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-bold animate-pulse">Loading orders...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
