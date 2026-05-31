import React, { useEffect, useState } from "react";
import { db, Order } from "../lib/db";
import { useConfig } from "../lib/config";
import { Button, Input } from "../components/ui";

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { settings } = useConfig();
  const [loading, setLoading] = useState(true);
  const [actionLinkId, setActionLinkId] = useState<string | null>(null);
  const [actionLinkInput, setActionLinkInput] = useState("");

  const loadData = async () => {
    setLoading(true);
    const o = await db.getOrders();
    setOrders(o);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (order: Order, status: "completed" | "rejected") => {
    if (status === "completed" && actionLinkId === order.id) {
      await db.updateOrderStatus(order.id, status, actionLinkInput);
      setActionLinkId(null);
      setActionLinkInput("");
    } else {
      await db.updateOrderStatus(order.id, status);
    }
    loadData();
  };

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-12 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Orders</h1>
          <p className="text-zinc-500 mt-1 font-medium">History of all user purchases.</p>
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
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{order.userEmail}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">
                    {order.productTitle}
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {order.userInput || <span className="text-zinc-600 italic">None</span>}
                  </td>
                  <td className="px-6 py-4 font-black tracking-tight text-white text-right">
                    {settings?.currencySymbol || "৳"}{order.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-widest ${
                      order.status === 'completed' || !order.status ? 'bg-green-950 text-green-500' : 
                      order.status === 'rejected' ? 'bg-red-950 text-red-500' : 'bg-amber-950 text-amber-500'
                    }`}>
                      {order.status || 'completed'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {order.status === 'pending' && (
                      <div className="flex gap-2 min-w-[200px]">
                        {actionLinkId === order.id ? (
                          <div className="flex gap-2 w-full">
                            <Input 
                              placeholder="Delivery Link / MSG" 
                              value={actionLinkInput} 
                              onChange={e => setActionLinkInput(e.target.value)} 
                              className="text-xs h-8 px-2"
                            />
                            <Button size="sm" className="h-8" onClick={() => handleUpdateStatus(order, "completed")}>OK</Button>
                          </div>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="text-xs text-green-500 border-green-900 hover:bg-green-950" onClick={() => setActionLinkId(order.id)}>
                              Complete
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs text-red-500 border-red-900 hover:bg-red-950" onClick={() => handleUpdateStatus(order, "rejected")}>
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                    {(order.status === 'completed' || !order.status) && order.deliveryLink && (
                       <a href={order.deliveryLink} target="_blank" rel="noreferrer" className="text-xs text-zinc-400 hover:text-white underline">View Link</a>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-600 font-bold">No orders yet.</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-600 font-bold animate-pulse">Loading orders...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
