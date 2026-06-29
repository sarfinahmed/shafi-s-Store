import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useConfig } from "../lib/config";
import { db, SocialLink, Transaction } from "../lib/db";
import { Button, Input, Textarea } from "../components/ui";
import { ExternalLink, Plus, Trash2, Wallet, Package, Copy, History, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { motion } from "motion/react";

export function Profile() {
  const [searchParams] = useSearchParams();
  const { user, updateProfile, deleteAccount } = useAuth();
  const { settings } = useConfig();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editing, setEditing] = useState(false);
  
  // Deposit state
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [trxId, setTrxId] = useState("");
  const [depositMsg, setDepositMsg] = useState("");

  // Delete state
  const [showDelete, setShowDelete] = useState(false);
  
  // Profile edit state
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

  // New link state
  const [showAddLink, setShowAddLink] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newLogo, setNewLogo] = useState("");

  const [typeFilter, setTypeFilter] = useState<"all" | "deposit" | "purchase" | "admin_deduction">("all");
  const [activeView, setActiveView] = useState<"none" | "deposits" | "spent" | "orders" | "codes">(
    searchParams.get("view") === "codes" ? "codes" : "none"
  );

  useEffect(() => {
    if (user && user.isAdmin) {
      db.getLinks(user.id).then(setLinks);
    }
    if (user && !user.isAdmin) {
      db.getUserDepositRequests(user.id).then(setDeposits);
      db.getUserOrders(user.id).then(setOrders);
      db.getTransactions(user.id).then(setTransactions);
    }
  }, [user]);

  if (!user) {
    return <div className="text-center py-20 text-zinc-500">Please sign in to view your profile.</div>;
  }

  const lifetimeDeposit = transactions.filter(t => t.type === 'deposit').reduce((acc, t) => acc + t.amount, 0);
  const lifetimeSpent = transactions.filter(t => t.type === 'purchase' || t.type === 'admin_deduction').reduce((acc, t) => acc + t.amount, 0);

  const filteredTransactions = transactions.filter(t => typeFilter === "all" || (typeFilter === 'purchase' ? (t.type === 'purchase' || t.type === 'admin_deduction') : t.type === typeFilter));


  const handleSaveProfile = async () => {
    await updateProfile({ name, bio, avatarUrl });
    setEditing(false);
  };

  const handleAddLink = async () => {
    if (!newPlatform || !newUrl) return;
    const link = await db.addLink({
      userId: user.id,
      platform: newPlatform,
      url: newUrl,
      logoUrl: newLogo
    });
    setLinks([...links, link]);
    setShowAddLink(false);
    setNewPlatform("");
    setNewUrl("");
    setNewLogo("");
  };

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0 || !trxId) {
      setDepositMsg("Invalid amount or transaction ID");
      return;
    }
    if (!user) return;
    try {
      const newD = await db.createDepositRequest(user.id, user.name, user.email, amt, trxId);
      setDeposits([newD, ...deposits]);
      setDepositMsg("Request submitted! Waiting for admin approval.");
      
      // Notify Admin via WhatsApp
      if (settings?.adminWhatsappNumber) {
        const msg = `New Deposit Request\nUser: ${user.email}\nAmount: ${settings.currencySymbol || "৳"}${amt.toFixed(2)}\nTrxID: ${trxId}`;
        let waAdmin = settings.adminWhatsappNumber.replace(/[^\d+]/g, '');
        if (waAdmin.startsWith('01')) waAdmin = '88' + waAdmin;
        
        if (!settings.telegramChatId) {
          const waLink = `https://wa.me/${waAdmin}?text=${encodeURIComponent(msg)}`;
          window.open(waLink, '_blank');
        }
      }

      setDepositAmount("");
      setTrxId("");
      setTimeout(() => setShowDeposit(false), 2000);
    } catch (e: any) {
      setDepositMsg(e.message || "Something went wrong.");
    }
  };

  const handleDeleteLink = async (id: string) => {
    await db.removeLink(id);
    setLinks(links.filter(l => l.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 px-4 md:px-0 mt-4 md:mt-8">
      {/* Profile Header */}
      <section className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-5 md:p-8 shadow-sm flex flex-col md:flex-row gap-5 md:gap-8 items-center md:items-start text-center md:text-left">
        <div className="w-20 h-20 md:w-28 md:h-28 bg-[#111] rounded-3xl border border-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-2xl md:text-3xl font-black text-zinc-800">{user.name.charAt(0).toUpperCase()}</div>
          )}
        </div>
        
        <div className="flex-1 w-full space-y-4">
          {editing && user.isAdmin ? (
            <div className="space-y-4 max-w-sm mx-auto md:mx-0">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" />
              <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short Bio" />
              <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="Avatar URL (optional)" />
              <div className="flex justify-center md:justify-start gap-2 pt-2">
                <Button onClick={handleSaveProfile}>Save</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tighter text-white">{user.name}</h2>
              {user.isAdmin && <p className="text-zinc-500 font-medium text-[10px] md:text-xs mt-1 md:mt-2 whitespace-pre-wrap">{user.bio || "No bio set."}</p>}
              {!user.isAdmin && <p className="text-zinc-500 font-medium text-[10px] md:text-xs mt-1">{user.email}</p>}
              {user.isAdmin && (
                <div className="mt-4 md:mt-6 flex justify-center md:justify-start">
                  <Button variant="outline" className="text-xs md:text-sm" onClick={() => setEditing(true)}>Edit Profile</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {!user.isAdmin ? (
        // Regular User Dashboard
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl p-4 md:p-6 flex flex-col items-center text-center hover:border-zinc-800 transition-colors">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Balance</p>
              <h3 className="text-xl md:text-2xl font-black text-white mb-3">{settings?.currencySymbol || "৳"}{(user.balance || 0).toFixed(2)}</h3>
              <Button 
                variant="outline" 
                className="text-[10px] md:text-xs h-8 px-3"
                onClick={() => {
                  setShowDeposit(!showDeposit);
                  setDepositMsg("");
                }}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Funds
              </Button>
            </div>
            
            <div 
              className={`bg-[#0a0a0a] border ${activeView === 'deposits' ? 'border-zinc-500' : 'border-zinc-900'} rounded-2xl p-4 md:p-6 flex flex-col items-center text-center cursor-pointer hover:border-zinc-800 transition-colors`}
              onClick={() => {
                if (activeView === 'deposits') {
                  setActiveView('none');
                  setTypeFilter('all');
                } else {
                  setActiveView('deposits');
                  setTypeFilter('deposit');
                }
              }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-3">
                <ArrowUpRight className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Deposits</p>
              <h3 className="text-xl md:text-2xl font-black text-white">{settings?.currencySymbol || "৳"}{lifetimeDeposit.toFixed(2)}</h3>
              <p className="text-[10px] text-zinc-600 font-bold mt-2 hover:text-white transition-colors">{activeView === 'deposits' ? 'Hide History' : 'Tap to filter History'}</p>
            </div>

            <div 
              className={`bg-[#0a0a0a] border ${activeView === 'spent' ? 'border-zinc-500' : 'border-zinc-900'} rounded-2xl p-4 md:p-6 flex flex-col items-center text-center cursor-pointer hover:border-zinc-800 transition-colors`}
              onClick={() => {
                if (activeView === 'spent') {
                  setActiveView('none');
                  setTypeFilter('all');
                } else {
                  setActiveView('spent');
                  setTypeFilter('purchase');
                }
              }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-3">
                <ArrowDownLeft className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Spent</p>
              <h3 className="text-xl md:text-2xl font-black text-white">{settings?.currencySymbol || "৳"}{lifetimeSpent.toFixed(2)}</h3>
              <p className="text-[10px] text-zinc-600 font-bold mt-2 hover:text-white transition-colors">{activeView === 'spent' ? 'Hide History' : 'Tap to filter History'}</p>
            </div>

            <div 
              className={`bg-[#0a0a0a] border ${activeView === 'orders' ? 'border-zinc-500' : 'border-zinc-900'} rounded-2xl p-4 md:p-6 flex flex-col items-center text-center cursor-pointer hover:border-zinc-800 transition-colors`}
              onClick={() => setActiveView(activeView === 'orders' ? 'none' : 'orders')}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-3">
                <Package className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">My Orders</p>
              <h3 className="text-xl md:text-2xl font-black text-white">{(user.purchasedProducts || []).length}</h3>
              <p className="text-[10px] text-zinc-600 font-bold mt-2 hover:text-white transition-colors">{activeView === 'orders' ? 'Hide Orders' : 'Tap to view Orders'}</p>
            </div>

            <div 
              className={`col-span-2 md:col-span-1 bg-[#0a0a0a] border ${activeView === 'codes' ? 'border-zinc-500' : 'border-zinc-900'} rounded-2xl p-4 md:p-6 flex flex-col items-center text-center cursor-pointer hover:border-zinc-800 transition-colors`}
              onClick={() => setActiveView(activeView === 'codes' ? 'none' : 'codes')}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-3">
                <Copy className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">My Codes</p>
              <h3 className="text-xl md:text-2xl font-black text-white">{orders.filter(o => o.deliveredCode).length}</h3>
              <p className="text-[10px] text-zinc-600 font-bold mt-2 hover:text-white transition-colors">{activeView === 'codes' ? 'Hide Codes' : 'Tap to view Codes'}</p>
            </div>
          </div>

          {showDeposit && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a0a0a] p-5 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-900 space-y-4 md:space-y-6">
              <div className="text-center mb-6">
                <h3 className="font-black text-base md:text-xl text-white">Add Funds</h3>
                <p className="text-zinc-400 text-xs md:text-sm mt-2 font-medium">Send money to any of the numbers below and enter the transaction details.</p>
              </div>

              {settings?.paymentMethods && settings.paymentMethods.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {settings.paymentMethods.map(pm => (
                    <div key={pm.id} className="bg-[#111] border border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center relative group">
                      <h4 className="text-sm font-black text-white mb-1 uppercase tracking-widest">{pm.name}</h4>
                      <p className="text-zinc-400 text-xs font-mono mb-2">{pm.details}</p>
                      <button 
                        onClick={() => {
                          const numberOnly = pm.details.replace(/[^\d+]/g, '');
                          navigator.clipboard.writeText(numberOnly || pm.details);
                          setDepositMsg(`Copied ${pm.name} number!`);
                          setTimeout(() => setDepositMsg(""), 3000);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider"
                        title="Copy Number"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy Number
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-zinc-500 bg-[#111] rounded-xl border border-dashed border-zinc-800 mb-6">
                  No payment methods available right now. Contact admin.
                </div>
              )}

              <div className="space-y-4 max-w-sm mx-auto">
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 md:mb-2">Amount ({settings?.currencySymbol || "৳"})</label>
                  <Input type="number" placeholder="e.g. 500" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 md:mb-2">Transaction ID / Sender Number</label>
                  <Input placeholder="TRX..." value={trxId} onChange={e => setTrxId(e.target.value)} />
                </div>
                {depositMsg && <p className="text-xs md:text-sm text-center font-bold text-amber-500">{depositMsg}</p>}
                <Button className="w-full text-xs md:text-sm h-10 md:h-12" onClick={handleDeposit} disabled={!depositAmount || !trxId}>Submit Request</Button>
              </div>
            </motion.div>
          )}

          {activeView === 'deposits' && deposits.length > 0 && (
            <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl md:rounded-3xl overflow-hidden p-5 md:p-6">
              <h3 className="text-base md:text-lg font-black text-white mb-3 md:mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-500" />
                Deposit History
              </h3>
              <div className="space-y-3">
                {deposits.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-4 bg-[#111] rounded-2xl border border-zinc-800">
                    <div>
                      <div className="text-white font-bold">{settings?.currencySymbol || "৳"}{d.amount.toFixed(2)}</div>
                      <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{new Date(d.createdAt).toLocaleString()}</div>
                      <div className="text-[10px] text-zinc-500 font-medium mt-1">TrxID: {d.trxId}</div>
                    </div>
                    <div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest ${d.status === 'approved' ? 'bg-green-950 text-green-500' : d.status === 'rejected' ? 'bg-red-950 text-red-500' : 'bg-amber-950 text-amber-500'}`}>
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeView === 'deposits' || activeView === 'spent') && filteredTransactions.length > 0 && (
            <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl md:rounded-3xl overflow-hidden p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-zinc-500" />
                  Transaction History
                </h3>
              </div>
              <div className="space-y-3">
                {filteredTransactions.map(t => (
                  <div key={t.id} className="flex items-start justify-between p-4 bg-[#111] rounded-2xl border border-zinc-800">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-2 rounded-lg ${t.type === 'deposit' || t.type === 'refund' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {t.type === 'deposit' || t.type === 'refund' ? <ArrowUpRight className={`w-4 h-4 ${t.type === 'deposit' || t.type === 'refund' ? 'text-green-500' : 'text-red-500'}`} /> : <ArrowDownLeft className="w-4 h-4 text-red-500" />}
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">{t.description}</div>
                        <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-1">{new Date(t.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className={`font-black text-sm ${t.type === 'deposit' || t.type === 'refund' ? 'text-green-500' : 'text-white'}`}>
                      {t.type === 'deposit' || t.type === 'refund' ? '+' : '-'}{settings?.currencySymbol || "৳"}{t.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {(activeView === 'deposits' || activeView === 'spent') && transactions.length > 0 && filteredTransactions.length === 0 && (
             <div className="text-center py-8 text-zinc-500 text-sm font-medium">No transactions found for the selected filter.</div>
          )}

          {activeView === 'orders' && orders.length > 0 && (
            <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl md:rounded-3xl overflow-hidden p-5 md:p-6">
              <h3 className="text-base md:text-lg font-black text-white mb-3 md:mb-4">My Orders</h3>
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o.id} className="flex flex-col gap-3 p-4 bg-[#111] rounded-2xl border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold text-sm md:text-base mb-1">{o.productTitle}</div>
                        <div className="text-xs text-zinc-500 font-medium">{new Date(o.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-[10px] md:text-xs px-2 py-1 rounded-full font-bold uppercase tracking-widest ${!o.status || o.status === 'completed' ? 'bg-green-950 text-green-500' : o.status === 'rejected' ? 'bg-red-950 text-red-500' : 'bg-amber-950 text-amber-500'}`}>
                          {o.status || "completed"}
                        </span>
                        <div className="text-xs font-black tracking-tight text-white">
                          {o.price !== undefined && o.price !== null ? `${settings?.currencySymbol || "৳"}${o.price.toFixed(2)}` : "-"}
                        </div>
                      </div>
                    </div>
                    {(!o.status || o.status === 'completed') && (o.deliveryLink || o.deliveredCode || o.redeemLink || o.tutorialVideoUrl) && (
                       <div className="mt-1 break-all bg-green-950/20 border border-green-900/50 p-3 rounded-xl text-xs flex flex-col gap-2">
                          <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Delivery Info:</span>
                          
                          {o.deliveredCode && (
                            <div className="bg-black/50 p-2 rounded border border-green-900/30 flex items-center justify-between">
                              <span className="font-mono text-green-400 font-bold">{o.deliveredCode}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-zinc-500 hover:text-white"
                                onClick={() => {
                                  navigator.clipboard.writeText(o.deliveredCode);
                                  // Optional: show a small toast here if available, or just copy
                                }}
                                title="Copy Code"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          )}

                          {o.redeemLink && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Redeem At:</span>
                              <a href={o.redeemLink} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-white underline underline-offset-4">{o.redeemLink}</a>
                            </div>
                          )}

                          {o.tutorialVideoUrl && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Tutorial:</span>
                              <a href={o.tutorialVideoUrl} target="_blank" rel="noreferrer" className="text-pink-400 hover:text-white underline underline-offset-4">Watch Video</a>
                            </div>
                          )}

                          {o.deliveryLink && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Link:</span>
                              <a href={o.deliveryLink} target="_blank" rel="noreferrer" className="text-green-400 hover:text-white underline underline-offset-4">{o.deliveryLink}</a>
                            </div>
                          )}
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'codes' && orders.filter(o => o.deliveredCode).length > 0 && (
            <div className="bg-[#0a0a0a] border border-zinc-900 rounded-2xl md:rounded-3xl p-4 md:p-6 mb-6">
              <h3 className="text-base md:text-lg font-black text-white mb-3 md:mb-4">My Codes</h3>
              <div className="space-y-3">
                {orders.filter(o => o.deliveredCode).map((o, i) => (
                  <div key={i} className="bg-[#111] border border-zinc-800 rounded-xl p-3 md:p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-white text-sm md:text-base">{o.productTitle}</div>
                      <div className="text-[10px] md:text-xs text-zinc-500">{new Date(o.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="bg-black/50 p-3 rounded-lg border border-green-900/30 flex items-center justify-between mb-2">
                      <span className="font-mono text-green-400 font-black text-sm tracking-wider">{o.deliveredCode}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-3 text-green-400 hover:text-white bg-green-950/30 hover:bg-green-900/50"
                        onClick={() => {
                          navigator.clipboard.writeText(o.deliveredCode || "");
                        }}
                        title="Copy Code"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {o.redeemLink && (
                        <a href={o.redeemLink} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:text-white font-bold uppercase tracking-widest underline underline-offset-4 flex items-center">
                          Redeem Here
                        </a>
                      )}
                      {o.tutorialVideoUrl && (
                        <a href={o.tutorialVideoUrl} target="_blank" rel="noreferrer" className="text-[10px] text-pink-400 hover:text-white font-bold uppercase tracking-widest underline underline-offset-4 flex items-center">
                          Watch Tutorial
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Deletion */}
          <div className="bg-red-950/20 border border-red-900/50 rounded-2xl md:rounded-3xl p-5 md:p-6">
            <h3 className="text-lg md:text-xl font-black text-red-500 mb-1 md:mb-2">Danger Zone</h3>
            <p className="text-red-400/80 text-xs md:text-sm mb-4 md:mb-6">Permanently delete your account and remove all associated data.</p>
            
            {showDelete ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                <p className="font-bold text-white text-sm">Are you absolutely sure?</p>
                <p className="text-xs text-zinc-400">This action cannot be undone. Your balance, purchased products, and profile data will be permanently deleted.</p>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button variant="danger" onClick={async () => {
                    await deleteAccount();
                  }}>Yes, delete my account</Button>
                  <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => setShowDelete(false)}>Cancel</Button>
                </div>
              </motion.div>
            ) : (
              <Button variant="danger" onClick={() => setShowDelete(true)}>Delete Account</Button>
            )}
          </div>
        </div>
      ) : (
        // Admin Links Section
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Social Links</h2>
            <Button variant="outline" size="sm" onClick={() => setShowAddLink(!showAddLink)} className="px-4">
              <Plus className="w-4 h-4 mr-2" /> Add Link
            </Button>
          </div>

          {showAddLink && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a0a0a] p-6 rounded-2xl border border-zinc-900 space-y-4">
              <h3 className="font-bold text-white text-sm">Add New Platform</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Platform (e.g. Instagram)" value={newPlatform} onChange={e => setNewPlatform(e.target.value)} />
                <Input placeholder="URL" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                 <Button variant="ghost" onClick={() => setShowAddLink(false)}>Cancel</Button>
                 <Button onClick={handleAddLink} disabled={!newPlatform || !newUrl}>Add Link</Button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {links.map((link, i) => {
              const isWhatsApp = link.platform.toLowerCase().includes('whatsapp');
              let href = link.url;
              if (isWhatsApp && !link.url.toLowerCase().startsWith('http') && !link.url.toLowerCase().startsWith('wa.me')) {
                const numberOnly = link.url.replace(/[^\d]/g, '');
                href = `https://wa.me/${numberOnly}`;
              } else if (!link.url.toLowerCase().startsWith('http') && !link.url.toLowerCase().startsWith('mailto:')) {
                href = `https://${link.url}`;
              }
              
              return (
              <motion.div 
                key={link.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-col bg-[#0a0a0a] rounded-2xl border border-zinc-900 p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-white">{link.platform}</span>
                  <button 
                    onClick={() => handleDeleteLink(link.id)}
                    className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <a href={href} target="_blank" rel="noreferrer" className="text-sm font-medium text-zinc-500 hover:text-white truncate">
                  {link.url}
                </a>
              </motion.div>
              );
            })}
            {links.length === 0 && !showAddLink && (
              <div className="col-span-full py-12 text-center text-zinc-600 font-medium">
                No links added. Add your social profiles here.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
