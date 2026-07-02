import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db, Product } from "../lib/db";
import { useAuth } from "../lib/auth";
import { useConfig } from "../lib/config";
import { Button } from "../components/ui";
import { ArrowLeft, CheckCircle, Lock } from "lucide-react";
import { motion } from "motion/react";

export function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { settings } = useConfig();
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [orderLink, setOrderLink] = useState("");
  const [selectedOption, setSelectedOption] = useState<{name: string, price?: number | null, stockCount?: number | null} | null>(null);

  useEffect(() => {
    if (id) {
      db.getProduct(id).then(res => {
        setProduct(res);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="text-center py-20 text-zinc-500 font-medium">Loading premium product...</div>;
  if (!product) return <div className="text-center py-20 text-red-500 font-bold">Product not found.</div>;
  if (product.isActive === false && !user?.isAdmin) {
    return <div className="text-center py-20 text-zinc-500 font-bold">This product is currently unavailable.</div>;
  }

  const currentPrice = selectedOption ? selectedOption.price : product.price;
  const currentTitle = selectedOption ? `${product.title} - ${selectedOption.name}` : product.title;

  const isActuallySoldOut = (() => {
    if (product.isSoldOut) return true;
    
    if (selectedOption) {
      if (selectedOption.stockCount !== undefined && selectedOption.stockCount !== null) {
        return selectedOption.stockCount <= 0;
      }
      return false; // Unlimited
    } else {
      // If no option is selected yet, check if ALL options are sold out
      if (product.options && product.options.length > 0) {
        let allSoldOut = true;
        for (const opt of product.options) {
          let optSoldOut = false;
          if (opt.stockCount !== undefined && opt.stockCount !== null) {
            optSoldOut = opt.stockCount <= 0;
          }
          if (!optSoldOut) {
            allSoldOut = false;
            break;
          }
        }
        return allSoldOut;
      } else {
        if (product.stockCount !== undefined && product.stockCount !== null) {
          return product.stockCount <= 0;
        }
        return false; // Unlimited
      }
    }
  })();

  const isLocked = product.isPremiumOnly && ((user?.totalSpent || 0) < 5000);

  const handlePurchase = async () => {
    if (!user) {
      setPurchaseError("Please sign in to purchase.");
      return;
    }
    if (product.requiredUserInputLabel && !userInput.trim()) {
      setPurchaseError(`${product.requiredUserInputLabel} is required.`);
      return;
    }
    if (product.options && product.options.length > 0 && !selectedOption) {
      setPurchaseError("Please select a package/option.");
      return;
    }
    
    setPurchaseError("");
    setPurchaseSuccess(false);

    try {
      const productToBuy = { ...product, price: currentPrice, title: currentTitle };
      const order = await db.purchaseProduct(user.id, productToBuy, userInput, selectedOption?.name);
      if (order.deliveredCode) {
        navigate("/profile?view=codes");
        return;
      }
      if (order.deliveryLink) {
        setOrderLink(order.deliveryLink);
      }
      setPurchaseSuccess(true);

    } catch (e: any) {
      setPurchaseError(e.message || "Purchase failed.");
    }
  };

  if (isLocked) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <Link to="/" className="inline-flex items-center text-xs font-medium text-zinc-500 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-3 h-3 mr-2" /> Back to Products
        </Link>
        <div className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center justify-center">
          <div className="bg-amber-500/10 p-5 rounded-full mb-6 border border-amber-500/30">
            <Lock className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-amber-500 uppercase tracking-widest mb-3">Premium Customer Only</h2>
          <p className="text-sm text-zinc-500 font-medium max-w-sm mb-6">
            আমাদের ওয়েবসাইট থেকে যারা ৫০০০ টাকার জিনিস কিনবে শুধু তারাই এইখান থেকে কিনতে পারবে।
          </p>
          <div className="bg-[#111] border border-zinc-800 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
              Your Total Spent: <span className="text-green-400">{user?.totalSpent?.toFixed(0) || 0}৳</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl md:max-w-4xl mx-auto py-2 md:py-6">
      <Link to="/" className="inline-flex items-center text-xs font-medium text-zinc-500 hover:text-white mb-4 transition-colors">
        <ArrowLeft className="w-3 h-3 mr-2" /> Back to Products
      </Link>
      
      {/* Top Banner */}
      <div className="w-full relative h-48 md:h-64 rounded-t-2xl overflow-hidden mb-6 border border-zinc-900 bg-[#111]">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.title} 
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent flex flex-col justify-end p-6">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white mb-1 shadow-sm">{product.title}</h1>
          <p className={`text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 flex items-center ${product.estimatedTime ? 'text-amber-400' : 'text-green-400'}`}>
             <span className={`w-2 h-2 rounded-full ${product.estimatedTime ? 'bg-amber-500' : 'bg-green-500'} mr-2 animate-pulse`}></span>
             {product.estimatedTime ? `Estimated Delivery: ${product.estimatedTime}` : 'Instant Delivery Available'}
          </p>
          {product.description && (
             <p className="text-zinc-300 text-sm max-w-2xl hidden md:block">{product.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        
        {/* 1. Select Recharge (Options) */}
        {product.options && product.options.length > 0 ? (
          <div className="bg-[#0a0a0a] rounded-2xl border border-zinc-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-900 flex items-center bg-[#0d0d0d]">
              <div className="w-6 h-6 rounded-full bg-green-900 text-green-400 font-bold text-xs flex items-center justify-center mr-3">1</div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Select Recharge</h2>
            </div>
            <div className="p-4 md:p-5 text-[#E6E6E6]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                {product.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full overflow-hidden flex flex-col items-center justify-center p-2 rounded-xl border transition-all h-[105px] md:h-[120px] ${
                      selectedOption === opt 
                        ? 'bg-zinc-800 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)] ring-1 ring-green-500/50' 
                        : 'bg-[#111] border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900'
                    }`}
                  >
                    <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wide text-center mb-1 leading-tight line-clamp-2 ${selectedOption === opt ? 'text-white' : 'text-zinc-300'}`}>{opt.name}</span>
                    <div className="flex flex-col items-center">
                      {opt.price !== undefined && opt.price !== null && (
                        <span className={`text-xs md:text-sm font-black ${selectedOption === opt ? 'text-green-400' : 'text-orange-400'}`}>
                          {settings?.currencySymbol || "BDT"} {opt.price.toFixed(0)}
                        </span>
                      )}
                      {(() => {
                        let stockDisplay = null;
                        if (product.optionCodes?.[opt.name] !== undefined && product.optionCodes[opt.name].length > 0) {
                          stockDisplay = `${product.optionCodes[opt.name].length} In Stock`;
                        } else if (opt.stockCount !== undefined && opt.stockCount !== null) {
                          stockDisplay = opt.stockCount > 0 ? `${opt.stockCount} In Stock` : 'Out of Stock';
                        } else {
                          stockDisplay = 'Unlimited';
                        }

                        if (product.isSoldOut) stockDisplay = 'Sold Out';

                        return (
                          <span className={`text-[9px] font-bold uppercase tracking-tighter mt-1 ${stockDisplay === 'Out of Stock' || stockDisplay === 'Sold Out' ? 'text-red-500' : (stockDisplay === 'Unlimited' ? 'text-blue-500' : 'text-zinc-500')}`}>
                            {stockDisplay}
                          </span>
                        );
                      })()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : product.price !== undefined && product.price !== null ? (
           <div className="bg-[#0a0a0a] rounded-2xl border border-zinc-900 p-5 flex justify-between items-center">
              <div className="flex flex-col">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Price</h2>
                {(() => {
                  let stockDisplay = null;
                  if (product.codes !== undefined && product.codes.length > 0) {
                    stockDisplay = `${product.codes.length} In Stock`;
                  } else if (product.stockCount !== undefined && product.stockCount !== null) {
                    stockDisplay = product.stockCount > 0 ? `${product.stockCount} In Stock` : 'Out of Stock';
                  }

                  if (product.isSoldOut) stockDisplay = 'Sold Out';

                  if (!stockDisplay) return null;

                  return (
                    <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${stockDisplay === 'Out of Stock' || stockDisplay === 'Sold Out' ? 'text-red-500' : 'text-green-500'}`}>
                      {stockDisplay}
                    </span>
                  );
                })()}
              </div>
              <div className="text-xl font-black text-orange-400">
                {product.price.toFixed(0)}{settings?.currencySymbol || "৳"}
              </div>
           </div>
        ) : null}

        {product.tutorialVideoUrl && (
           <a href={product.tutorialVideoUrl} target="_blank" rel="noreferrer" className="block text-center mt-3 mb-6">
              <span className="text-[10px] md:text-xs font-black text-pink-500 hover:text-pink-400 underline underline-offset-4 tracking-wider transition-colors">
                এইখানে ক্লিক করে ইউনিপিন এর টিউটোরিয়াল দেখুন
              </span>
           </a>
        )}

        {/* 2. Account Info (User Input) */}
        {product.requiredUserInputLabel && (
          <div className="bg-[#0a0a0a] rounded-2xl border border-zinc-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-900 flex items-center bg-[#0d0d0d]">
              <div className="w-6 h-6 rounded-full bg-green-900 text-green-400 font-bold text-xs flex items-center justify-center mr-3">
                 {product.options && product.options.length > 0 ? "2" : "1"}
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Account Info</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-2">{product.requiredUserInputLabel}</label>
                <input 
                  type="text" 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="w-full bg-[#111] border border-zinc-800 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-700"
                  placeholder={`Enter ${product.requiredUserInputLabel}`}
                />
              </div>
              {product.description && (
                <div className="text-xs text-zinc-500 whitespace-pre-wrap md:hidden">
                   {product.description}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Action / Buy */}
        {((currentPrice !== undefined && currentPrice !== null) || (product.options && product.options.length > 0) || product.whatsappNumber) && (
          <div className="bg-[#0a0a0a] rounded-2xl border border-zinc-900 overflow-hidden">
            <div className="p-5">
              {purchaseSuccess && (
              <div className="flex flex-col items-center justify-center bg-green-950/30 border border-green-900/50 text-green-400 py-4 px-4 rounded-xl font-bold text-sm mb-6">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    {product.isManualFulfillment ? "Order Pending Admin Verification" : "Purchased Successfully"}
                  </div>
                  {product.isManualFulfillment && (
                      <div className="text-zinc-500 font-medium text-[10px] uppercase tracking-widest mt-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                        {product.estimatedTime ? `Estimated Wait: ${product.estimatedTime}` : "Check Profile > My Orders"}
                      </div>
                  )}
                </div>
                {orderLink && (
                    <div className="mt-3 break-all bg-green-950/50 px-3 py-2 rounded-lg text-center text-xs">
                      <span className="text-zinc-500 font-medium block mb-1">Your Link:</span>
                      <a href={orderLink} target="_blank" rel="noreferrer" className="text-green-300 hover:text-white underline underline-offset-4 pointer-events-auto cursor-pointer block">{orderLink}</a>
                    </div>
                )}
              </div>
            )}
            
            {purchaseError && <p className="text-red-500 text-xs font-bold mb-4 text-center">{purchaseError}</p>}
            
            <div className="flex flex-col sm:flex-row gap-3">
              {((currentPrice !== undefined && currentPrice !== null) || (product.options && product.options.length > 0)) && (
                <>
                  {!user ? (
                    <div className="flex gap-2 w-full">
                      <Link to="/login?register=true" className="flex-1">
                        <Button className="w-full text-[10px] md:text-sm py-6 bg-zinc-100 hover:bg-white text-black font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                          Create Account
                        </Button>
                      </Link>
                      <Link to="/login" className="flex-1">
                        <Button className="w-full text-[10px] md:text-sm py-6 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest border border-zinc-800">
                          Login
                        </Button>
                      </Link>
                    </div>
                  ) : isActuallySoldOut ? (
                    <Button disabled className="flex-1 text-sm py-6 bg-red-950 text-red-500 font-black uppercase tracking-widest border border-red-900/50 opacity-75 cursor-not-allowed">
                      Sold Out
                    </Button>
                  ) : (
                    <Button onClick={handlePurchase} className="flex-1 text-sm py-6 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                      {currentPrice !== undefined && currentPrice !== null ? `Buy Now - ${currentPrice.toFixed(0)}${settings?.currencySymbol || "৳"}` : "Select a Package"}
                    </Button>
                  )}
                </>
              )}

              {product.whatsappNumber && (
                <Button 
                  variant="outline" 
                  disabled={isActuallySoldOut}
                  onClick={() => {
                    if (product.options && product.options.length > 0 && !selectedOption) {
                      setPurchaseError("Please select a package/option before instant buy.");
                      return;
                    }
                    setPurchaseError("");
                    let num = product.whatsappNumber!.replace(/[^\d+]/g, '');
                    if (num.startsWith('01')) {
                      num = '88' + num;
                    }
                    const priceText = currentPrice !== undefined && currentPrice !== null ? `\nPrice: ${settings?.currencySymbol || "৳"}${currentPrice.toFixed(2)}` : '';
                    const msg = `Hello! I would like to instantly buy:\n*${currentTitle}*${priceText}${userInput ? `\n\n${product.requiredUserInputLabel}: ${userInput}` : ''}`;
                    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="flex-1 text-sm py-6 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 font-bold uppercase tracking-widest"
                >
                  WhatsApp Buy
                </Button>
              )}
            </div>
          </div>
        </div>
        )}

      </div>
    </div>
  );
}
