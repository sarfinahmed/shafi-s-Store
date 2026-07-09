import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db, Product } from "../lib/db";
import { useAuth } from "../lib/auth";
import { useConfig } from "../lib/config";
import { Button } from "../components/ui";
import { ArrowLeft, CheckCircle, Lock, Loader2, PlayCircle } from "lucide-react";
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
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [orderLink, setOrderLink] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [checkingName, setCheckingName] = useState(false);
  const [checkedName, setCheckedName] = useState<string | null>(null);

  const checkFreeFireName = async () => {
    const uid = userInput.trim();
    if (!uid) return;
    if (uid.length < 3) {
      setCheckedName("❌ Enter a valid UID");
      return;
    }

    setCheckingName(true);
    setCheckedName(null);
    try {
      const response = await fetch('/api/check-freefire-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          uid,
          apiUrl: settings?.freeFireApiUrl,
          apiKey: settings?.freeFireApiKey
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data?.success) {
        setCheckedName(data.name);
      } else {
        setCheckedName(data.name || "❌ API Error");
      }
    } catch (error) {
      console.error("Error checking name:", error);
      setCheckedName("❌ API Error");
    } finally {
      setCheckingName(false);
    }
  };

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

  const currentPrice = product.options && product.options.length > 0
    ? selectedOptions.reduce((sum, name) => {
        const opt = product.options!.find(o => o.name === name);
        return sum + (opt?.price || 0);
      }, 0)
    : product.price;

  const currentTitle = selectedOptions.length > 0 
    ? `${product.title} - ${selectedOptions.join(", ")}` 
    : product.title;

  const toggleOption = (optName: string) => {
    const opt = product?.options?.find(o => o.name === optName);
    if (opt?.isSoldOut) return;
    
    setSelectedOptions(prev => 
      prev.includes(optName) ? prev.filter(n => n !== optName) : [...prev, optName]
    );
  };

  const isActuallySoldOut = product.isSoldOut || false;

  const isLocked = product.isPremiumOnly && 
    (user?.premiumStatus === 'blocked' ? true : 
     user?.premiumStatus === 'granted' ? false :
     ((user?.totalSpent || 0) < (settings?.premiumThreshold ?? 5000)));

  const handlePurchase = async () => {
    if (!user) {
      setPurchaseError("Please sign in to purchase.");
      return;
    }
    if (product.requiredUserInputLabel && !userInput.trim()) {
      setPurchaseError(`${product.requiredUserInputLabel} is required.`);
      return;
    }
    if (product.options && product.options.length > 0 && selectedOptions.length === 0) {
      setPurchaseError("Please select at least one package/option.");
      return;
    }

    if (currentPrice !== undefined && currentPrice !== null) {
      const totalPrice = currentPrice * quantity;
      if ((user.balance || 0) < totalPrice) {
        setPurchaseError(`Insufficient funds. You need ${settings?.currencySymbol || "৳"}${totalPrice.toFixed(2)} but have ${settings?.currencySymbol || "৳"}${(user.balance || 0).toFixed(2)}`);
        return;
      }
    }
        
    setPurchaseError("");
    setPurchaseSuccess(false);
    setIsPurchasing(true);

    try {
      if (product.options && product.options.length > 0) {
        let lastLink = "";
        let hasCode = false;
        let successCount = 0;
        
        try {
          // Purchase each selected option sequentially
          for (const optName of selectedOptions) {
            const opt = product.options.find(o => o.name === optName);
            const optPrice = opt?.price ?? 0;
            const productToBuy = { ...product, price: optPrice, title: product.title };
            
            const order = await db.purchaseProduct(user.id, productToBuy, userInput, optName, quantity);
            if (order.deliveredCode) hasCode = true;
            if (order.deliveryLink) lastLink = order.deliveryLink;
            successCount++;
          }
        } catch (innerError: any) {
          if (successCount > 0) {
             throw new Error(`Partially failed after ${successCount} items: ${innerError.message}`);
          } else {
             throw innerError;
          }
        }
        
        if (hasCode) {
          navigate("/profile?view=codes");
          return;
        }
        if (lastLink) {
          setOrderLink(lastLink);
        }
      } else {
        const productToBuy = { ...product, price: product.price, title: product.title };
        const order = await db.purchaseProduct(user.id, productToBuy, userInput, undefined, quantity);
        if (order.deliveredCode) {
          navigate("/profile?view=codes");
          return;
        }
        if (order.deliveryLink) {
          setOrderLink(order.deliveryLink);
        }
      }
      
      setPurchaseSuccess(true);

    } catch (e: any) {
      setPurchaseError(e.message || "Purchase failed.");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4 md:py-8">
      <Link to="/" className="inline-flex items-center text-xs font-medium text-zinc-500 hover:text-white mb-6 transition-colors px-4 md:px-0">
        <ArrowLeft className="w-3 h-3 mr-2" /> Back
      </Link>

      {isLocked && (
        <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3 text-zinc-400">
          <Lock className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">শুধুমাত্র প্রিমিয়াম কাস্টমারদের জন্য। এই প্রোডাক্টটি আনলক করতে আপনাকে অন্তত {settings?.currencySymbol || "BDT"} ৫০০০ খরচ করতে হবে।</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Left Col: Image & Description */}
        <div className="space-y-6 sticky top-24">
          <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 group">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-700 font-bold uppercase tracking-widest text-sm">No Image</div>
            )}
            {product.category && (
               <div className="absolute top-4 left-4">
                 <span className="bg-black/50 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                   {product.category}
                 </span>
               </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent flex flex-col justify-end p-6">
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white mb-1 shadow-sm">{product.title}</h1>
              <p className={`text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 flex items-center ${product.estimatedTime ? 'text-amber-400' : 'text-green-400'}`}>
                 <span className={`w-2 h-2 rounded-full ${product.estimatedTime ? 'bg-amber-500' : 'bg-green-500'} mr-2 animate-pulse`}></span>
                 {product.estimatedTime ? `Estimated Delivery: ${product.estimatedTime}` : 'Instant Delivery Available'}
              </p>
            </div>
          </div>
          
          {product.description && (
            <div className="bg-[#0a0a0a] rounded-2xl border border-zinc-900 p-6 hidden md:block">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Product Description</h3>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          )}
          
          {!product.requiredUserInputLabel && product.tutorialVideoUrl && (
            <div className="hidden md:block">
              <a href={product.tutorialVideoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[11px] font-bold text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 rounded-lg border border-amber-500/20 transition-colors w-full justify-center">
                <PlayCircle className="w-4 h-4 mr-1.5" />
                Watch Tutorial Video
              </a>
            </div>
          )}
        </div>

        {/* Right Col: Options & Purchase */}
        <div className="space-y-6">
            {/* 1. Select Recharge (Options) */}
            {product.options && product.options.length > 0 ? (
              <div className="bg-[#0a0a0a] rounded-2xl border border-zinc-900 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-900 flex items-center bg-[#0d0d0d]">
                  <div className="w-6 h-6 rounded-full bg-green-900 text-green-400 font-bold text-xs flex items-center justify-center mr-3">1</div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">Select Recharge</h2>
                </div>
                <div className="p-4 md:p-5 text-[#E6E6E6]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {product.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => toggleOption(opt.name)}
                        className={`w-full relative overflow-hidden flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border transition-all min-h-[90px] md:min-h-[100px] ${
                          opt.isSoldOut 
                            ? 'bg-zinc-950 border-zinc-900 opacity-60 cursor-not-allowed grayscale'
                            : selectedOptions.includes(opt.name) 
                              ? 'bg-zinc-800 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)] ring-1 ring-green-500/50' 
                              : 'bg-[#111] border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900'
                        }`}
                      >
                        {(() => {
                          let stockDisplay = null;
                          let stockColor = "text-zinc-500";
                          let dotColor = "bg-green-500";
                          
                          if (opt.isSoldOut) {
                            stockDisplay = 'Sold Out';
                            stockColor = "text-red-500";
                            dotColor = "bg-red-500";
                          } else if (product.optionCodes?.[opt.name] !== undefined) {
                            if (product.optionCodes[opt.name].length > 0) {
                              stockDisplay = `${product.optionCodes[opt.name].length} Stock`;
                              stockColor = "text-green-500";
                            } else {
                              stockDisplay = 'Sold Out';
                              stockColor = "text-red-500";
                              dotColor = "bg-red-500";
                            }
                          } else if (opt.stockCount !== undefined && opt.stockCount !== null) {
                            if (opt.stockCount > 0) {
                              stockDisplay = `${opt.stockCount} Stock`;
                              stockColor = "text-green-500";
                            } else {
                              stockDisplay = 'Sold Out';
                              stockColor = "text-red-500";
                              dotColor = "bg-red-500";
                            }
                          } else {
                            stockDisplay = 'In Stock';
                            stockColor = "text-zinc-400";
                          }

                          return (
                            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-md border border-white/5">
                              <div className={`w-1 h-1 rounded-full ${dotColor} ${stockDisplay !== 'Sold Out' ? 'animate-pulse' : ''}`}></div>
                              <span className={`text-[7px] font-black uppercase tracking-tighter ${stockColor}`}>
                                {stockDisplay}
                              </span>
                            </div>
                          );
                        })()}

                        <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wide text-center mb-1 leading-tight line-clamp-2 mt-2 ${selectedOptions.includes(opt.name) ? 'text-white' : 'text-zinc-300'}`}>{opt.name}</span>
                        <div className="flex flex-col items-center">
                          {opt.price !== undefined && opt.price !== null && (
                            <span className={`text-xs md:text-sm font-black ${selectedOptions.includes(opt.name) ? 'text-green-400' : 'text-orange-400'}`}>
                              {settings?.currencySymbol || "BDT"} {opt.price.toFixed(0)}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

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
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={userInput}
                        onChange={(e) => {
                           setUserInput(e.target.value);
                           setCheckedName(null);
                        }}
                        className="w-full bg-[#111] border border-zinc-800 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-700"
                        placeholder={`Enter ${product.requiredUserInputLabel}`}
                      />
                      {(product.title.toLowerCase().includes("free fire") || product.title.toLowerCase().includes("ff") || (product.requiredUserInputLabel && product.requiredUserInputLabel.toLowerCase().includes("uid"))) && (
                        <button
                          onClick={checkFreeFireName}
                          disabled={checkingName || !userInput.trim()}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-zinc-700 transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                          {checkingName ? "Checking..." : "Check Name"}
                        </button>
                      )}
                    </div>
                    {checkedName && (
                      <div className={`text-xs font-bold mt-2 ${checkedName.includes("❌") ? 'text-red-500' : 'text-green-400'}`}>
                        {checkedName}
                      </div>
                    )}
                  </div>
                  {product.tutorialVideoUrl && (
                    <a href={product.tutorialVideoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[11px] font-bold text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 rounded-lg border border-amber-500/20 transition-colors">
                      <PlayCircle className="w-4 h-4 mr-1.5" />
                      How to find your {product.requiredUserInputLabel || "ID"} (Tutorial Video)
                    </a>
                  )}
                  {product.description && (
                    <div className="text-xs text-zinc-500 whitespace-pre-wrap md:hidden">
                       {product.description}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Fallback Description & Tutorial (if no requiredUserInputLabel) */}
            {!product.requiredUserInputLabel && (product.description || product.tutorialVideoUrl) && (
              <div className="md:hidden space-y-4">
                {product.tutorialVideoUrl && (
                  <a href={product.tutorialVideoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[11px] font-bold text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 rounded-lg border border-amber-500/20 transition-colors w-full justify-center">
                    <PlayCircle className="w-4 h-4 mr-1.5" />
                    Watch Tutorial Video
                  </a>
                )}
                {product.description && (
                  <div className="bg-[#0a0a0a] rounded-2xl border border-zinc-900 p-5">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Product Description</h3>
                    <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap">{product.description}</p>
                  </div>
                )}
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
                
                {((currentPrice !== undefined && currentPrice !== null) || (product.options && product.options.length > 0)) && (
                  <div className="flex items-center justify-between mb-4 bg-[#111] p-3 rounded-xl border border-zinc-800">
                    <span className="text-sm font-bold text-zinc-300">Quantity</span>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-bold"
                      >-</button>
                      <span className="font-bold text-white w-4 text-center">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-bold"
                      >+</button>
                    </div>
                  </div>
                )}

                {currentPrice !== undefined && currentPrice !== null && currentPrice > 0 && (
                  <div className="flex justify-between items-center p-4 bg-green-950/20 border border-green-900/30 rounded-xl mb-4">
                    <span className="text-zinc-400 font-bold text-sm">Total Price</span>
                    <span className="text-green-400 font-black text-xl">{settings?.currencySymbol || "৳"}{(currentPrice * quantity).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  {!user ? (
                    <div className="flex gap-2 w-full">
                      <Link to="/login?register=true" className="flex-1">
                        <button className="w-full text-[10px] py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest rounded-lg border border-zinc-700 transition-colors">
                          Create Account
                        </button>
                      </Link>
                      <Link to="/login" className="flex-1">
                        <button className="w-full text-[10px] py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest rounded-lg border border-zinc-800 transition-colors">
                          Login
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      {((currentPrice !== undefined && currentPrice !== null) || (product.options && product.options.length > 0)) && (
                        <>
                          {isActuallySoldOut ? (
                            <Button disabled className="flex-1 text-sm py-4 bg-red-950 text-red-500 font-black uppercase tracking-widest border border-red-900/50 opacity-75 cursor-not-allowed">
                              Sold Out
                            </Button>
                          ) : isLocked ? (
                            <Button disabled className="flex-1 text-sm py-4 bg-zinc-900 text-zinc-500 font-black uppercase tracking-widest border border-zinc-800 opacity-75 cursor-not-allowed">
                              Premium Only
                            </Button>
                          ) : (
                            <Button disabled={isPurchasing} onClick={handlePurchase} className="flex-1 text-sm py-4 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                              {isPurchasing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Buy Now"}
                            </Button>
                          )}
                        </>
                      )}

                      {product.whatsappNumber && (
                    <Button 
                      variant="outline" 
                      disabled={isActuallySoldOut || isPurchasing || isLocked}
                      onClick={() => {
                        if (product.options && product.options.length > 0 && selectedOptions.length === 0) {
                          setPurchaseError("Please select a package/option before instant buy.");
                          return;
                        }
                        setPurchaseError("");
                        
                        const priceText = currentPrice !== undefined && currentPrice !== null ? `\nPrice: ${settings?.currencySymbol || "৳"}${(currentPrice * quantity).toFixed(2)}\nQuantity: ${quantity}` : '';
                        const msg = `Hello! I would like to instantly buy:\n*${currentTitle}*${priceText}${userInput ? `\n\n${product.requiredUserInputLabel}: ${userInput}` : ''}`;
                        
                        const link = product.whatsappNumber!;
                        
                        if (link.startsWith('http') || link.startsWith('https://')) {
                          if (link.includes('t.me')) {
                            window.open(`${link}?text=${encodeURIComponent(msg)}`, '_blank');
                          } else if (link.includes('wa.me')) {
                            window.open(`${link}?text=${encodeURIComponent(msg)}`, '_blank');
                          } else {
                            window.open(link, '_blank');
                          }
                        } else {
                          let num = link.replace(/[^\d+]/g, '');
                          if (num.startsWith('01')) {
                            num = '88' + num;
                          }
                          window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
                        }
                      }}
                      className={`flex-1 text-sm py-4 font-bold uppercase tracking-widest ${
                        product.whatsappNumber!.includes('t.me') 
                          ? 'border-[#0088cc]/30 text-[#0088cc] hover:bg-[#0088cc]/10' 
                          : (!product.whatsappNumber!.startsWith('http') || product.whatsappNumber!.includes('wa.me')) 
                            ? 'border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10' 
                            : 'border-zinc-500/30 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {product.whatsappNumber!.includes('t.me') ? "Telegram Buy" : (product.whatsappNumber!.startsWith('http') && !product.whatsappNumber!.includes('wa.me')) ? "Order Link" : "WhatsApp Buy"}
                    </Button>
                  )}
                    </>
                  )}
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
  );
}
