import React, { useEffect, useState } from "react";
import { db, Product, User, SocialLink } from "../lib/db";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useConfig } from "../lib/config";
import { ExternalLink, Search } from "lucide-react";
import { Input } from "../components/ui";

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { settings } = useConfig();

  useEffect(() => {
    db.getProducts().then((productsList) => {
      setProducts(productsList);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-20 text-zinc-500 font-medium">Loading content...</div>;

  const activeProducts = products.filter(p => 
    p.isActive !== false && 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedProducts = activeProducts.reduce((acc, p) => {
    const cat = p.category && p.category.trim() !== "" ? p.category.trim() : "Featured Products";
    const existingKey = Object.keys(acc).find(k => k.toLowerCase() === cat.toLowerCase());
    const finalCat = existingKey || cat;
    if (!acc[finalCat]) acc[finalCat] = [];
    acc[finalCat].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="space-y-4 md:space-y-8">
      {(settings?.heroTitle || settings?.heroSubtitle) && (
        <div className="text-center max-w-2xl mx-auto px-4 mt-2.5">
          {settings?.heroTitle && (
            <h1 className="text-xl md:text-3xl font-black tracking-tighter mb-1.5 md:mb-2 text-white">
              {settings.heroTitle}
            </h1>
          )}
          {settings?.heroSubtitle && (
            <p className="text-xs md:text-sm font-medium text-zinc-400">
              {settings.heroSubtitle}
            </p>
          )}
        </div>
      )}

      {settings?.noticeBanner && (
        <div className="mx-4 md:mx-0 bg-orange-950/30 border border-orange-900/50 rounded-lg p-2.5 flex items-center gap-2">
          <div className="text-orange-500 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-xs md:text-sm text-orange-200 font-medium whitespace-pre-wrap">{settings.noticeBanner}</p>
          </div>
        </div>
      )}

      <div className="mx-4 md:mx-0 relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
        <Input 
          placeholder="Search products..." 
          className="pl-10 bg-[#111] border-zinc-800 text-sm py-4 rounded-xl shadow-inner w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-8 md:space-y-12">
        {(Object.entries(groupedProducts) as [string, Product[]][]).map(([category, catProducts]) => (
          <div key={category} className="border-t border-zinc-900/50 pt-6 md:pt-8">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white mb-4 md:mb-6 px-2 md:px-0 uppercase">{category}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 px-2 md:px-0">
            {catProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-[#0a0a0a] rounded-2xl border border-zinc-900 overflow-hidden hover:border-zinc-700 transition-all duration-300 shadow-xl"
              >
                <Link to={`/product/${product.id}`} className="block">
                  <div className="aspect-square bg-[#111] border-b border-zinc-900 overflow-hidden flex items-center justify-center">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="w-1/2 h-1/2 border border-zinc-800 opacity-50"></div>
                    )}
                  </div>
                  <div className="p-3 md:p-5 flex flex-col gap-1 md:gap-2">
                    <div className="flex justify-between items-start gap-2 md:gap-4">
                      <h4 className="text-xs md:text-sm font-bold truncate text-white">{product.title}</h4>
                      <p className="text-xs md:text-sm font-black whitespace-nowrap text-white">
                        {product.price !== undefined && product.price !== null ? `${settings?.currencySymbol || "৳"}${product.price.toFixed(0)}` : ""}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold truncate flex-1">
                        {product.description || "Premium Product"}
                      </p>
                      {/* Stock Indicator */}
                      {(product.codes !== undefined || product.optionCodes !== undefined) && (
                        <div className="ml-2 flex items-center gap-1.5 flex-shrink-0">
                          {(() => {
                            const totalStock = (product.codes?.length || 0) + 
                              Object.values(product.optionCodes || {}).reduce((acc, codes) => acc + (codes?.length || 0), 0);
                            
                            return totalStock > 0 ? (
                              <>
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">{totalStock} Stock</span>
                              </>
                            ) : (
                              <>
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Sold Out</span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                      {product.estimatedTime && !product.codes && !product.optionCodes && (
                        <span className="text-[8px] md:text-[9px] bg-[#1a1a1a] border border-zinc-800 text-amber-500 px-1.5 py-0.5 rounded font-black tracking-widest uppercase ml-2 whitespace-nowrap">
                           {product.estimatedTime}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
      </div>

      {activeProducts.length === 0 && (
        <div className="text-center py-20 text-zinc-500 bg-[#0a0a0a] rounded-xl border border-dashed border-zinc-800 font-medium">
          No products available yet. Come back later!
        </div>
      )}
    </div>
  );
}
