import React, { useEffect, useState } from "react";
import { db, Product, User, SocialLink } from "../lib/db";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useConfig } from "../lib/config";
import { ExternalLink } from "lucide-react";

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useConfig();

  useEffect(() => {
    db.getProducts().then((productsList) => {
      setProducts(productsList);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-20 text-zinc-500 font-medium">Loading content...</div>;

  const groupedProducts = products.reduce((acc, p) => {
    const cat = p.category && p.category.trim() !== "" ? p.category.trim() : "Featured Products";
    const existingKey = Object.keys(acc).find(k => k.toLowerCase() === cat.toLowerCase());
    const finalCat = existingKey || cat;
    if (!acc[finalCat]) acc[finalCat] = [];
    acc[finalCat].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="space-y-8 md:space-y-16">
      <div className="text-center py-6 md:py-16 max-w-2xl mx-auto px-4 mt-4 md:mt-8">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 md:mb-6 text-white">
          {settings?.heroTitle || "আপনাকে স্বাগতম Shafi’s Store এ"}
        </h1>
        <p className="text-base md:text-lg font-medium text-zinc-400">
          {settings?.heroSubtitle || "Quality Products, Trusted Service."}
        </p>
      </div>

      {settings?.noticeBanner && (
        <div className="mx-4 md:mx-0 bg-orange-950/30 border border-orange-900/50 rounded-xl p-4 flex items-start gap-4">
          <div className="mt-0.5 text-orange-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-1">Notice</h3>
            <p className="text-sm text-zinc-300 font-medium whitespace-pre-wrap">{settings.noticeBanner}</p>
          </div>
        </div>
      )}

      <div className="space-y-16 md:space-y-24">
        {Object.entries(groupedProducts).map(([category, catProducts]) => (
          <div key={category} className="border-t border-zinc-900/50 pt-10 md:pt-16">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-6 md:mb-10 px-2 md:px-0 uppercase">{category}</h2>
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
                        {settings?.currencySymbol || "৳"}{product.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold truncate">
                      {product.description || "Premium Product"}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-20 text-zinc-500 bg-[#0a0a0a] rounded-xl border border-dashed border-zinc-800 font-medium">
          No products available yet. Come back later!
        </div>
      )}
    </div>
  );
}
