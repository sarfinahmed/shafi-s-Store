import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useConfig } from "../lib/config";
import { db, Product, User, SocialLink } from "../lib/db";
import { Button, Input, Textarea } from "../components/ui";
import { Plus, Trash2, CheckCircle, Edit } from "lucide-react";

export function Admin() {
  const { user } = useAuth();
  const { settings } = useConfig();
  const [products, setProducts] = useState<Product[]>([]);
  
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
  const [newIsManualFulfillment, setNewIsManualFulfillment] = useState(false);
  const [newOptionsStr, setNewOptionsStr] = useState("");

  const [notification, setNotification] = useState("");

  const loadData = async () => {
    const p = await db.getProducts();
    setProducts(p);
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
    if (!newTitle || !newPrice) return;
    
    let parsedOptions: { name: string; price: number }[] | undefined = undefined;
    if (newOptionsStr.trim()) {
      parsedOptions = newOptionsStr.split("\n")
        .map(line => line.trim())
        .filter(line => line.includes(":"))
        .map(line => {
          const parts = line.split(":");
          return { name: parts[0].trim(), price: parseFloat(parts[1].trim()) };
        })
        .filter(opt => !isNaN(opt.price));
    }

    if (editingProduct) {
      const productData: any = {
        title: newTitle,
        description: newDesc,
        price: parseFloat(newPrice),
        imageUrl: newImageUrl,
        category: newCategory,
        requiredUserInputLabel: newRequiredUserInputLabel,
        deliveryLink: newDeliveryLink,
        whatsappNumber: newWhatsappNumber,
        isManualFulfillment: newIsManualFulfillment,
      };
      if (parsedOptions && parsedOptions.length > 0) {
        productData.options = parsedOptions;
      } else {
        productData.options = [];
      }

      await db.updateProduct(editingProduct.id, productData);
      notify("Product updated successfully");
    } else {
      const productData: any = {
        title: newTitle,
        description: newDesc,
        price: parseFloat(newPrice),
        imageUrl: newImageUrl,
        category: newCategory,
        requiredUserInputLabel: newRequiredUserInputLabel,
        deliveryLink: newDeliveryLink,
        whatsappNumber: newWhatsappNumber,
        isManualFulfillment: newIsManualFulfillment,
      };
      if (parsedOptions && parsedOptions.length > 0) {
        productData.options = parsedOptions;
      } else {
        productData.options = [];
      }

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
    setNewIsManualFulfillment(false);
    setNewOptionsStr("");
    loadData();
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setNewTitle(product.title);
    setNewDesc(product.description || "");
    setNewPrice(product.price.toString());
    setNewImageUrl(product.imageUrl || "");
    setNewCategory(product.category || "");
    setNewRequiredUserInputLabel(product.requiredUserInputLabel || "");
    setNewDeliveryLink(product.deliveryLink || "");
    setNewWhatsappNumber(product.whatsappNumber || "");
    setNewIsManualFulfillment(product.isManualFulfillment || false);
    setNewOptionsStr(product.options ? product.options.map(o => `${o.name} : ${o.price}`).join("\n") : "");
    setShowAddProduct(true);
  };


  const handleDeleteProduct = async (id: string) => {
    await db.removeProduct(id);
    notify("Product removed");
    loadData();
  };

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-12 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Products</h1>
          <p className="text-zinc-500 mt-1 font-medium">Manage your premium offerings.</p>
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
          <h2 className="text-xl font-bold text-white">Total ({products.length})</h2>
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
            setNewIsManualFulfillment(false);
            setNewOptionsStr("");
            setShowAddProduct(!showAddProduct);
          }}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>

        {showAddProduct && (
          <div className="bg-[#0a0a0a] p-6 rounded-3xl border border-zinc-900 shadow-2xl space-y-4 mb-6">
            <h3 className="font-bold text-white">{editingProduct ? "Edit Product" : "New Product Details"}</h3>
            <datalist id="category-list">
              {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Product Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <Input type="number" placeholder="Price" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
              <Input placeholder="Category (e.g. Featured Products)" list="category-list" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
              <Input placeholder="Image URL (optional)" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} />
              <Input placeholder="Input Label (e.g. Player ID)" value={newRequiredUserInputLabel} onChange={e => setNewRequiredUserInputLabel(e.target.value)} />
              <Input placeholder="Delivery Link (given after purchase)" value={newDeliveryLink} onChange={e => setNewDeliveryLink(e.target.value)} />
              <Input placeholder="Specific WhatsApp (e.g. 88017XX)" value={newWhatsappNumber} onChange={e => setNewWhatsappNumber(e.target.value)} />
              <Textarea placeholder="Description" className="md:col-span-2 whitespace-pre-wrap" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              <Textarea 
                placeholder="Product Options / Packages (Format: Name : Price)
Weekly : 158
Monthly : 790
Leave empty for single item." 
                className="md:col-span-2 font-mono whitespace-pre-wrap" 
                value={newOptionsStr} 
                onChange={e => setNewOptionsStr(e.target.value)} 
              />
              <label className="md:col-span-2 flex items-center space-x-3 text-sm text-zinc-400">
                <input 
                  type="checkbox" 
                  checked={newIsManualFulfillment} 
                  onChange={e => setNewIsManualFulfillment(e.target.checked)}
                  className="w-4 h-4 bg-[#111] border-zinc-800 rounded focus:ring-zinc-600"
                />
                <span>Manual Fulfillment (Admin completes the order manually, no instant delivery)</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => {
                setShowAddProduct(false);
                setEditingProduct(null);
              }}>Cancel</Button>
              <Button onClick={handleSaveProduct} disabled={!newTitle || !newPrice}>Save Product</Button>
            </div>
          </div>
        )}

        <div className="bg-[#0a0a0a] rounded-3xl border border-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase bg-[#111] text-zinc-500 font-black tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#111] overflow-hidden flex-shrink-0 flex items-center justify-center border border-zinc-800">
                          {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-4 h-4 border border-zinc-700 opacity-30"></div>}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-white truncate">{product.title}</div>
                          <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 truncate mt-1">
                            {product.category ? `${product.category} • ` : ""}{product.description || "No description"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-white">{settings?.currencySymbol || "৳"}{product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(product)} className="text-blue-500 hover:text-blue-400 hover:bg-blue-950/30 w-10 h-10 p-0 rounded-xl">
                          <Edit className="w-5 h-5 mx-auto" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)} className="text-red-500 hover:text-red-400 hover:bg-red-950/30 w-10 h-10 p-0 rounded-xl">
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
