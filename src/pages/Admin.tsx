import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useConfig } from "../lib/config";
import { db, Product, User, SocialLink } from "../lib/db";
import { Button, Input, Textarea } from "../components/ui";
import { Plus, Trash2, CheckCircle, Edit, Eye, EyeOff, ArrowUp, ArrowDown, Copy, Users, ShoppingBag, CreditCard, DollarSign } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Admin() {
  const { user } = useAuth();
  const { settings } = useConfig();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
    pageViews: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Add/Edit Product State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newRequiredUserInputLabel, setNewRequiredUserInputLabel] = useState("");
  const [newDeliveryLink, setNewDeliveryLink] = useState("");
  const [newWhatsappNumber, setNewWhatsappNumber] = useState("");
  const [newEstimatedTime, setNewEstimatedTime] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("");
  const [newIsManualFulfillment, setNewIsManualFulfillment] = useState(false);
  const [newIsSoldOut, setNewIsSoldOut] = useState(false);
  const [newIsPremiumOnly, setNewIsPremiumOnly] = useState(false);
  const [newOptionsArr, setNewOptionsArr] = useState<{name: string; price: string; codes: string; stockCount?: string}[]>([]);
  const [newCodes, setNewCodes] = useState("");
  const [newStockCount, setNewStockCount] = useState("");
  const [newRedeemLink, setNewRedeemLink] = useState("");
  const [newTutorialVideoUrl, setNewTutorialVideoUrl] = useState("");

  const [notification, setNotification] = useState("");

  const loadData = async () => {
    const [p, users, orders, pageViews] = await Promise.all([
      db.getProducts(),
      db.getAllUsers(),
      db.getOrders(),
      db.getTodayPageViews()
    ]);
    setProducts(p);
    
    const rev = orders.reduce((acc, o) => acc + (o.price || 0), 0);
    setStats({
      totalUsers: users.length,
      totalProducts: p.length,
      totalOrders: orders.length,
      revenue: rev,
      pageViews: pageViews
    });

    // Process chart data (last 7 days)
    const days = 7;
    const now = new Date();
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate.toDateString() === d.toDateString();
      });
      
      const dayRevenue = dayOrders.reduce((acc, o) => acc + (o.price || 0), 0);
      result.push({ name: dateStr, revenue: dayRevenue });
    }
    setChartData(result);
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

  const handleSaveProduct = async () => {
    if (!newTitle) return;
    
    let parsedOptions: { name: string; price: number; stockCount?: number | null }[] | undefined = undefined;
    let optionCodes: Record<string, string[]> = {};
    
    const validOptions = newOptionsArr.filter(opt => opt.name.trim() !== "");
    if (validOptions.length > 0) {
      parsedOptions = validOptions.map(opt => ({
        name: opt.name.trim(),
        price: parseFloat(opt.price) || 0,
        stockCount: opt.stockCount && opt.stockCount.trim() !== "" ? parseInt(opt.stockCount, 10) : null
      }));
      
      validOptions.forEach(opt => {
        const codesList = opt.codes.split('\n').map(c => c.trim()).filter(c => c);
        if (codesList.length > 0) {
          optionCodes[opt.name.trim()] = codesList;
        }
      });
    }

    const setProductData = () => {
      const data: any = {
        title: newTitle,
        description: newDesc,
        imageUrl: newImageUrl,
        category: newCategory,
        requiredUserInputLabel: newRequiredUserInputLabel,
        deliveryLink: newDeliveryLink,
        whatsappNumber: newWhatsappNumber,
        estimatedTime: newEstimatedTime,
        isManualFulfillment: newIsManualFulfillment,
        isSoldOut: newIsSoldOut,
        isPremiumOnly: newIsPremiumOnly,
        sortOrder: newSortOrder.trim() !== "" ? parseInt(newSortOrder, 10) : null,
        codes: newCodes.split('\n').map(c => c.trim()).filter(c => c),
        optionCodes: optionCodes,
        stockCount: newStockCount.trim() !== "" ? parseInt(newStockCount, 10) : null,
        redeemLink: newRedeemLink,
        tutorialVideoUrl: newTutorialVideoUrl,
      };
      if (newPrice.trim()) {
        data.price = parseFloat(newPrice);
      } else {
        data.price = null;
      }
      if (parsedOptions && parsedOptions.length > 0) {
        data.options = parsedOptions;
      } else {
        data.options = [];
      }
      return data;
    };

    if (editingProduct) {
      const productData = setProductData();
      await db.updateProduct(editingProduct.id, productData);
      notify("Product updated successfully");
    } else {
      const productData = setProductData();
      await db.addProduct(productData);
      notify("Product added successfully");
    }

    setShowAddProduct(false);
    setEditingProduct(null);
    setNewTitle("");
    setNewDesc("");
    setNewPrice("");
    setNewImageUrl("");
    setNewCategory("");
    setNewRequiredUserInputLabel("");
    setNewDeliveryLink("");
    setNewWhatsappNumber("");
    setNewEstimatedTime("");
    setNewSortOrder("");
    setNewIsManualFulfillment(false);
    setNewIsSoldOut(false);
    setNewIsPremiumOnly(false);
    setNewOptionsArr([]);
    setNewCodes("");
    setNewStockCount("");
    setNewRedeemLink("");
    setNewTutorialVideoUrl("");
    loadData();
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setNewTitle(product.title);
    setNewDesc(product.description || "");
    setNewPrice(product.price !== undefined && product.price !== null ? product.price.toString() : "");
    setNewImageUrl(product.imageUrl || "");
    setNewCategory(product.category || "");
    setNewRequiredUserInputLabel(product.requiredUserInputLabel || "");
    setNewDeliveryLink(product.deliveryLink || "");
    setNewWhatsappNumber(product.whatsappNumber || "");
    setNewEstimatedTime(product.estimatedTime || "");
    setNewSortOrder(product.sortOrder !== undefined && product.sortOrder !== null ? product.sortOrder.toString() : "");
    setNewIsManualFulfillment(product.isManualFulfillment || false);
    setNewIsSoldOut(product.isSoldOut || false);
    setNewIsPremiumOnly(product.isPremiumOnly || false);
    setNewOptionsArr(product.options ? product.options.map(o => ({ 
      name: o.name, 
      price: o.price.toString(),
      stockCount: o.stockCount !== null && o.stockCount !== undefined ? o.stockCount.toString() : "",
      codes: (product.optionCodes?.[o.name] || []).join('\n')
    })) : []);
    setNewCodes((product.codes || []).join('\n'));
    setNewStockCount(product.stockCount !== null && product.stockCount !== undefined ? product.stockCount.toString() : "");
    setNewRedeemLink(product.redeemLink || "");
    setNewTutorialVideoUrl(product.tutorialVideoUrl || "");
    setShowAddProduct(true);
  };


  const handleDeleteProduct = async (id: string) => {
    await db.removeProduct(id);
    notify("Product removed");
    loadData();
  };

  const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
    await db.updateProduct(id, { isActive: !currentStatus });
    notify(`Product ${!currentStatus ? 'is now visible' : 'is now hidden'}`);
    loadData();
  };

  const handleMoveProduct = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === products.length - 1) return;

    const currentConfigs = products.map((p, i) => ({ id: p.id, sortOrder: p.sortOrder !== undefined && p.sortOrder !== null ? p.sortOrder : (i + 1) * 10 }));
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    const p1 = currentConfigs[index];
    const p2 = currentConfigs[targetIndex];

    const temp = p1.sortOrder;
    p1.sortOrder = p2.sortOrder;
    p2.sortOrder = temp;

    await Promise.all([
      db.updateProduct(p1.id, { sortOrder: p1.sortOrder }),
      db.updateProduct(p2.id, { sortOrder: p2.sortOrder })
    ]);
    
    notify("Product order updated");
    loadData();
  };

  const handleDuplicateProduct = async (product: Product) => {
    const { id, createdAt, ...rest } = product;
    await db.addProduct({
      ...rest,
      title: `${product.title} (Copy)`,
      isActive: false
    });
    notify("Product duplicated as hidden");
    loadData();
  };

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-12 max-w-5xl">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-zinc-50 dark:bg-[#0a0a0a] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-900">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShoppingBag className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">Products</span>
          </div>
          <div className="text-2xl font-black text-black dark:text-white">{stats.totalProducts}</div>
        </div>
        <div className="bg-zinc-50 dark:bg-[#0a0a0a] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-900">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">Users</span>
          </div>
          <div className="text-2xl font-black text-black dark:text-white">{stats.totalUsers}</div>
        </div>
        <div className="bg-zinc-50 dark:bg-[#0a0a0a] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-900">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <CreditCard className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">Orders</span>
          </div>
          <div className="text-2xl font-black text-black dark:text-white">{stats.totalOrders}</div>
        </div>
        <div className="bg-zinc-50 dark:bg-[#0a0a0a] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-900">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">Revenue</span>
          </div>
          <div className="text-2xl font-black text-black dark:text-white">{settings?.currencySymbol || "৳"}{stats.revenue.toLocaleString()}</div>
        </div>
        <div className="bg-zinc-50 dark:bg-[#0a0a0a] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-900">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <Eye className="w-4 h-4 text-pink-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">Today's Views</span>
          </div>
          <div className="text-2xl font-black text-black dark:text-white">{stats.pageViews}</div>
        </div>
      </div>

      <div className="bg-zinc-50 dark:bg-[#0a0a0a] p-6 rounded-3xl border border-zinc-200 dark:border-zinc-900 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 mb-6 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Revenue Overview (Last 7 Days)
        </h3>
        <div className="h-[200px] md:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#52525b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontWeight: 700 }}
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${settings?.currencySymbol || "৳"}${value}`}
                tick={{ fontWeight: 700 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a0a0a', 
                  border: '1px solid #1f1f1f', 
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  fontFamily: 'Inter, sans-serif'
                }}
                itemStyle={{ color: '#22c55e' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#22c55e" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRev)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-black dark:text-white">Products</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1 font-medium">Manage your premium offerings.</p>
        </div>
        {notification && (
          <div className="flex items-center text-green-400 bg-green-950/30 border border-green-900/50 px-4 py-2 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 mr-2" />
            {notification}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-black dark:text-white">Total ({products.length})</h2>
          <Button onClick={() => {
            setEditingProduct(null);
            setNewTitle("");
            setNewDesc("");
            setNewPrice("");
            setNewImageUrl("");
            setNewCategory("");
            setNewRequiredUserInputLabel("");
            setNewDeliveryLink("");
            setNewWhatsappNumber("");
            setNewEstimatedTime("");
            setNewIsManualFulfillment(false);
            setNewOptionsArr([]);
            setShowAddProduct(!showAddProduct);
          }}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>

        {showAddProduct && (
          <div className="bg-zinc-50 dark:bg-[#0a0a0a] p-6 rounded-3xl border border-zinc-200 dark:border-zinc-900 shadow-2xl space-y-4 mb-6">
            <h3 className="font-bold text-black dark:text-white">{editingProduct ? "Edit Product" : "New Product Details"}</h3>
            <datalist id="category-list">
              {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Product Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <Input type="number" placeholder="Price (leave empty for none)" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
              <Input placeholder="Category (e.g. Featured Products)" list="category-list" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
              <Input placeholder="Image URL (optional)" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} />
              <Input placeholder="Input Label (e.g. Player ID)" value={newRequiredUserInputLabel} onChange={e => setNewRequiredUserInputLabel(e.target.value)} />
              <Input placeholder="Estimated Wait Time (e.g. 5-10 Minutes)" value={newEstimatedTime} onChange={e => setNewEstimatedTime(e.target.value)} />
              <Input type="number" placeholder="Order Priority (1 = top, empty = bottom)" value={newSortOrder} onChange={e => setNewSortOrder(e.target.value)} />
              <Input type="number" placeholder="Stock Count (Empty = Unlimited)" value={newStockCount} onChange={e => setNewStockCount(e.target.value)} />
              <Input placeholder="Delivery Link (given after purchase)" value={newDeliveryLink} onChange={e => setNewDeliveryLink(e.target.value)} />
              <Input placeholder="Specific WhatsApp (e.g. 88017XX)" value={newWhatsappNumber} onChange={e => setNewWhatsappNumber(e.target.value)} />
              <Textarea placeholder="Description" className="md:col-span-2 whitespace-pre-wrap" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              
              <div className="md:col-span-2 space-y-3 bg-zinc-100 dark:bg-[#111] p-4 rounded-2xl border border-zinc-300 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Packages / Options</label>
                  <Button variant="outline" size="sm" onClick={() => setNewOptionsArr([...newOptionsArr, {name: '', price: '', codes: ''}])}>
                    <Plus className="w-4 h-4 mr-1" /> Add Package
                  </Button>
                </div>
                {newOptionsArr.length === 0 && (
                  <p className="text-xs text-zinc-600 font-medium">Leave empty for a single-item product.</p>
                )}
                {newOptionsArr.map((opt, idx) => (
                  <div key={idx} className="space-y-2 bg-white/40 dark:bg-black/40 p-4 rounded-xl border border-zinc-300 dark:border-zinc-800">
                    <div className="flex gap-2 items-center">
                      <Input 
                        placeholder="Package Name (e.g. Weekly)" 
                        value={opt.name} 
                        onChange={e => {
                          const updated = [...newOptionsArr];
                          updated[idx].name = e.target.value;
                          setNewOptionsArr(updated);
                        }} 
                      />
                      <Input 
                        type="number" 
                        placeholder="Price" 
                        value={opt.price} 
                        onChange={e => {
                          const updated = [...newOptionsArr];
                          updated[idx].price = e.target.value;
                          setNewOptionsArr(updated);
                        }} 
                      />
                      <Input 
                        type="number" 
                        placeholder="Stock (Empty = Unlimited)" 
                        value={opt.stockCount || ""} 
                        onChange={e => {
                          const updated = [...newOptionsArr];
                          updated[idx].stockCount = e.target.value;
                          setNewOptionsArr(updated);
                        }} 
                      />
                      <Button 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-400 hover:bg-red-950/30 px-3"
                        onClick={() => {
                          const updated = newOptionsArr.filter((_, i) => i !== idx);
                          setNewOptionsArr(updated);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">
                        Codes for {opt.name || 'this package'} ({opt.codes.split('\n').filter(c => c.trim()).length} in stock)
                      </label>
                      <Textarea 
                        placeholder="Enter codes for this option (one per line)..." 
                        className="text-xs h-20 bg-zinc-100 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800"
                        value={opt.codes}
                        onChange={e => {
                          const updated = [...newOptionsArr];
                          updated[idx].codes = e.target.value;
                          setNewOptionsArr(updated);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="md:col-span-2 space-y-3 bg-zinc-100 dark:bg-[#111] p-4 rounded-2xl border border-zinc-300 dark:border-zinc-800 mt-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Auto Code Delivery (Fallback / Global)</label>
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-white/50 dark:bg-black/50 px-2 py-1 rounded border border-white/5">
                    {newCodes.split('\n').filter(c => c.trim()).length} In Stock
                  </span>
                </div>
                <p className="text-xs text-zinc-600 font-medium">Add codes one per line. These codes are used if no variant-specific codes are available.</p>
                <Textarea 
                  placeholder="Enter codes here (one per line)..." 
                  className="whitespace-pre-wrap h-32" 
                  value={newCodes} 
                  onChange={e => setNewCodes(e.target.value)} 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Redeem Link</label>
                    <Input placeholder="e.g. https://shop.garena.sg/app" value={newRedeemLink} onChange={e => setNewRedeemLink(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Tutorial Video URL</label>
                    <Input placeholder="e.g. https://youtube.com/watch?v=..." value={newTutorialVideoUrl} onChange={e => setNewTutorialVideoUrl(e.target.value)} />
                  </div>
                </div>
              </div>

              <label className="md:col-span-2 flex items-center space-x-3 text-sm text-zinc-600 dark:text-zinc-400 mt-4">
                <input 
                  type="checkbox" 
                  checked={newIsManualFulfillment} 
                  onChange={e => setNewIsManualFulfillment(e.target.checked)}
                  className="w-4 h-4 bg-zinc-100 dark:bg-[#111] border-zinc-300 dark:border-zinc-800 rounded focus:ring-zinc-600"
                />
                <span>Manual Fulfillment (Admin completes the order manually, no instant delivery)</span>
              </label>
              
              <label className="md:col-span-2 flex items-center space-x-3 text-sm text-zinc-600 dark:text-zinc-400">
                <input 
                  type="checkbox" 
                  checked={newIsSoldOut} 
                  onChange={e => setNewIsSoldOut(e.target.checked)}
                  className="w-4 h-4 bg-zinc-100 dark:bg-[#111] border-zinc-300 dark:border-zinc-800 rounded focus:ring-zinc-600 text-red-500 focus:ring-red-500"
                />
                <span className="text-red-400 font-bold">Mark as Sold Out</span>
              </label>

              <label className="md:col-span-2 flex items-center space-x-3 text-sm text-zinc-600 dark:text-zinc-400">
                <input 
                  type="checkbox" 
                  checked={newIsPremiumOnly} 
                  onChange={e => setNewIsPremiumOnly(e.target.checked)}
                  className="w-4 h-4 bg-zinc-100 dark:bg-[#111] border-zinc-300 dark:border-zinc-800 rounded focus:ring-zinc-600 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-amber-400 font-bold">Premium Customer Only (Requires 5000 ৳ spent)</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => {
                setShowAddProduct(false);
                setEditingProduct(null);
              }}>Cancel</Button>
              <Button onClick={handleSaveProduct} disabled={!newTitle}>Save Product</Button>
            </div>
          </div>
        )}

        <div className="bg-zinc-50 dark:bg-[#0a0a0a] rounded-3xl border border-zinc-200 dark:border-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase bg-zinc-100 dark:bg-[#111] text-zinc-600 dark:text-zinc-400 font-black tracking-widest border-b border-zinc-200 dark:border-zinc-900">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-700 dark:text-zinc-300">
                {products.map((product, index) => (
                  <tr key={product.id} className="hover:bg-zinc-200 dark:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-[#111] overflow-hidden flex-shrink-0 flex items-center justify-center border border-zinc-300 dark:border-zinc-800">
                          {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-4 h-4 border border-zinc-400 dark:border-zinc-700 opacity-30"></div>}
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <div className={`font-bold truncate ${product.isActive === false ? 'text-zinc-600 dark:text-zinc-400' : 'text-black dark:text-white'}`}>{product.title}</div>
                            {product.isActive === false && (
                              <span className="bg-zinc-200 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase border border-zinc-300 dark:border-zinc-800">Hidden</span>
                            )}
                          </div>
                          <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 dark:text-zinc-400 truncate mt-1">
                            {product.category ? `${product.category} • ` : ""}{product.description || "No description"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-black dark:text-white">
                      {product.price !== undefined && product.price !== null ? `${settings?.currencySymbol || "৳"}${product.price.toFixed(2)}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleMoveProduct(index, 'up')}
                          disabled={index === 0}
                          className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-800 w-8 h-8 p-0 rounded-xl disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4 mx-auto" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleMoveProduct(index, 'down')}
                          disabled={index === products.length - 1}
                          className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-800 w-8 h-8 p-0 rounded-xl disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4 mx-auto" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleVisibility(product.id, product.isActive !== false)} 
                          className={`w-10 h-10 p-0 rounded-xl ${product.isActive !== false ? 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-800' : 'text-amber-500 hover:text-amber-400 hover:bg-amber-950/30'}`}
                          title={product.isActive !== false ? "Hide Product" : "Show Product"}
                        >
                          {product.isActive !== false ? <EyeOff className="w-5 h-5 mx-auto" /> : <Eye className="w-5 h-5 mx-auto" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDuplicateProduct(product)} className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-800 w-10 h-10 p-0 rounded-xl" title="Duplicate Product">
                          <Copy className="w-5 h-5 mx-auto" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(product)} className="text-blue-500 hover:text-blue-400 hover:bg-blue-950/30 w-10 h-10 p-0 rounded-xl" title="Edit Product">
                          <Edit className="w-5 h-5 mx-auto" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)} className="text-red-500 hover:text-red-400 hover:bg-red-950/30 w-10 h-10 p-0 rounded-xl" title="Delete Product">
                          <Trash2 className="w-5 h-5 mx-auto" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-zinc-600 font-bold">No products found.</td>
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
