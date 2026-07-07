import React, { useState } from "react";
import { useConfig } from "../lib/config";
import { useAuth } from "../lib/auth";
import { Button, Input, Textarea } from "../components/ui";
import { CheckCircle, Plus, Trash2, Eye, Bell, X } from "lucide-react";
import { PaymentMethod } from "../lib/db";

export function AdminSettings() {
  const { user } = useAuth();
  const { settings, updateSettings } = useConfig();
  
  const [appName, setAppName] = useState(settings?.appName || "");
  const [heroTitle, setHeroTitle] = useState(settings?.heroTitle || "");
  const [heroSubtitle, setHeroSubtitle] = useState(settings?.heroSubtitle || "");
  const [currencySymbol, setCurrencySymbol] = useState(settings?.currencySymbol || "৳");
  const [adminWhatsappNumber, setAdminWhatsappNumber] = useState(settings?.adminWhatsappNumber || "");
  const [telegramChatIds, setTelegramChatIds] = useState<string[]>(
    settings?.telegramChatIds || (settings?.telegramChatId ? settings.telegramChatId.split(",").map(id => id.trim()).filter(id => id) : [])
  );
  const [dailyPopupEnabled, setDailyPopupEnabled] = useState(settings?.dailyPopupEnabled ?? true);
  const [dailyPopupImage, setDailyPopupImage] = useState(settings?.dailyPopupImage || "");
  const [dailyPopupTitle, setDailyPopupTitle] = useState(settings?.dailyPopupTitle || "");
  const [dailyPopupMessage, setDailyPopupMessage] = useState(settings?.dailyPopupMessage || "");
  const [dailyPopupLink, setDailyPopupLink] = useState(settings?.dailyPopupLink || "");
  const [dailyPopupLinkLabel, setDailyPopupLinkLabel] = useState(settings?.dailyPopupLinkLabel || "Join Now");
  const [showPreview, setShowPreview] = useState(false);
  const [newChatId, setNewChatId] = useState("");
  const [noticeBanner, setNoticeBanner] = useState(settings?.noticeBanner || "");
  const [maintenanceMode, setMaintenanceMode] = useState(settings?.maintenanceMode || false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(settings?.paymentMethods || []);
  const [freeFireApiUrl, setFreeFireApiUrl] = useState(settings?.freeFireApiUrl || "");
  const [freeFireApiKey, setFreeFireApiKey] = useState(settings?.freeFireApiKey || "");
  const [garenaShellApiUrl, setGarenaShellApiUrl] = useState(settings?.garenaShellApiUrl || "");
  const [garenaShellApiKey, setGarenaShellApiKey] = useState(settings?.garenaShellApiKey || "");
  const [unipinApiUrl, setUnipinApiUrl] = useState(settings?.unipinApiUrl || "");
  const [unipinApiKey, setUnipinApiKey] = useState(settings?.unipinApiKey || "");
  const [tutorialContent, setTutorialContent] = useState(settings?.tutorialContent || "");
  const [tutorialVideos, setTutorialVideos] = useState<{title: string, url: string}[]>(settings?.tutorialVideos || []);
  
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState("");

  if (!user?.isAdmin) {
    return <div className="text-center py-20 text-red-500 font-medium">Access Denied. Admins only.</div>;
  }

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      appName,
      heroTitle,
      heroSubtitle,
      currencySymbol,
      adminWhatsappNumber,
      telegramChatIds,
      dailyPopupEnabled,
      dailyPopupImage,
      dailyPopupTitle,
      dailyPopupMessage,
      dailyPopupLink,
      dailyPopupLinkLabel,
      noticeBanner,
      maintenanceMode,
      paymentMethods,
      freeFireApiUrl,
      freeFireApiKey,
      garenaShellApiUrl,
      garenaShellApiKey,
      unipinApiUrl,
      unipinApiKey,
      tutorialContent,
      tutorialVideos
    });
    setSaving(false);
    notify("Settings saved successfully");
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Settings</h1>
          <p className="text-zinc-500 mt-1 font-medium">Configure global app settings.</p>
        </div>
        {notification && (
          <div className="flex items-center text-green-400 bg-green-950/30 border border-green-900/50 px-4 py-2 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 mr-2" />
            {notification}
          </div>
        )}
      </div>

      <div className="bg-[#0a0a0a] rounded-3xl border border-zinc-900 p-8 shadow-sm space-y-6">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">App Name</label>
            <Input 
              value={appName} 
              onChange={e => setAppName(e.target.value)} 
              placeholder="e.g. Shafi Topup"
            />
            <p className="text-xs text-zinc-500 mt-2 font-medium">This appears in the header and footer.</p>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Hero Title</label>
            <Input 
              value={heroTitle} 
              onChange={e => setHeroTitle(e.target.value)} 
              placeholder="e.g. Discover Premium Products"
            />
            <p className="text-xs text-zinc-500 mt-2 font-medium">Main heading on the home page.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Hero Subtitle</label>
            <Textarea 
              value={heroSubtitle} 
              onChange={e => setHeroSubtitle(e.target.value)} 
              placeholder="e.g. Browse the latest offerings..."
              className="resize-none h-24"
            />
            <p className="text-xs text-zinc-500 mt-2 font-medium">Secondary text below the hero title.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Currency Symbol</label>
            <Input 
              value={currencySymbol} 
              onChange={e => setCurrencySymbol(e.target.value)} 
              placeholder="e.g. ৳ or $"
            />
            <p className="text-xs text-zinc-500 mt-2 font-medium">Used across the app to display prices.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Admin WhatsApp Number</label>
            <Input 
              value={adminWhatsappNumber} 
              onChange={e => setAdminWhatsappNumber(e.target.value)} 
              placeholder="e.g. 8801700000000"
            />
            <p className="text-xs text-zinc-500 mt-2 font-medium">Include country code (e.g., 880 for BD). Users will be redirected here after purchases or deposits.</p>
          </div>

          <div className="bg-[#111] border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Daily Popup Configuration</h3>
              <div className="flex items-center space-x-4">
                <Button size="sm" variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="w-4 h-4 mr-2" /> Preview
                </Button>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={dailyPopupEnabled} 
                    onChange={e => setDailyPopupEnabled(e.target.checked)}
                    className="rounded border-zinc-800 bg-black text-indigo-500 focus:ring-indigo-500/20"
                  />
                  <span className="text-xs text-zinc-300 font-medium">Enable</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Popup Image URL (Optional)</label>
              <Input 
                value={dailyPopupImage} 
                onChange={e => setDailyPopupImage(e.target.value)} 
                placeholder="e.g. https://example.com/image.png"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Popup Title</label>
              <Input 
                value={dailyPopupTitle} 
                onChange={e => setDailyPopupTitle(e.target.value)} 
                placeholder="e.g. Join Our Community"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Popup Message</label>
              <Textarea 
                value={dailyPopupMessage} 
                onChange={e => setDailyPopupMessage(e.target.value)} 
                placeholder="e.g. Get the latest updates..."
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Button Link</label>
                <Input 
                  value={dailyPopupLink} 
                  onChange={e => setDailyPopupLink(e.target.value)} 
                  placeholder="e.g. https://t.me/channel"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Button Label</label>
                <Input 
                  value={dailyPopupLinkLabel} 
                  onChange={e => setDailyPopupLinkLabel(e.target.value)} 
                  placeholder="e.g. Join Now"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Telegram API Chat ID(s) (Automatic Notifications)</label>
            <div className="space-y-2 mb-2">
              {telegramChatIds.map((id, index) => (
                <div key={index} className="flex items-center justify-between bg-black border border-zinc-900 rounded-md px-3 py-2">
                  <span className="text-sm text-zinc-300">{id}</span>
                  <button 
                    onClick={() => setTelegramChatIds(telegramChatIds.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input 
                value={newChatId} 
                onChange={e => setNewChatId(e.target.value)} 
                placeholder="e.g. 6891891678"
                className="bg-black border-zinc-900"
              />
              <Button 
                onClick={() => {
                  if (newChatId.trim() && !telegramChatIds.includes(newChatId.trim())) {
                    setTelegramChatIds([...telegramChatIds, newChatId.trim()]);
                    setNewChatId("");
                  }
                }}
                variant="outline"
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-zinc-500 mt-2 font-medium">Add your chat ID(s) to get automatic notifications via the connected Telegram Bot. You can find this using a bot like @userinfobot.</p>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Notice Banner Text (Leaves empty to hide)</label>
            <Textarea 
              value={noticeBanner} 
              onChange={e => setNoticeBanner(e.target.value)} 
              placeholder="e.g. Due to a server issue, instant delivery might be delayed..."
              className="resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Tutorial Content (Markdown supported)</label>
            <Textarea 
              value={tutorialContent} 
              onChange={e => setTutorialContent(e.target.value)} 
              placeholder="Write a guide for users on how to topup or redeem codes. You can use markdown."
              className="resize-none h-40"
            />
          </div>

          <div className="pt-6 border-t border-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">Tutorial Videos</label>
              <Button size="sm" variant="outline" onClick={() => setTutorialVideos([...tutorialVideos, { title: '', url: '' }])}>
                <Plus className="w-4 h-4 mr-2" /> Add Video
              </Button>
            </div>
            <div className="space-y-4">
              {tutorialVideos.map((tv, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex-1 space-y-2">
                    <Input 
                      placeholder="Video Title (e.g. Free Fire Topup Tutorial)" 
                      value={tv.title}
                      onChange={(e) => {
                        const next = [...tutorialVideos];
                        next[i].title = e.target.value;
                        setTutorialVideos(next);
                      }}
                    />
                    <Input 
                      placeholder="Video URL (e.g. https://youtube.com/...)" 
                      value={tv.url}
                      onChange={(e) => {
                        const next = [...tutorialVideos];
                        next[i].url = e.target.value;
                        setTutorialVideos(next);
                      }}
                    />
                  </div>
                  <Button variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-950/30 px-3 h-10 mt-1" onClick={() => {
                    setTutorialVideos(tutorialVideos.filter((_, index) => index !== i));
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {tutorialVideos.length === 0 && (
                <p className="text-zinc-500 text-sm font-medium">No tutorial videos added.</p>
              )}
            </div>
          </div>

          <label className="flex items-center space-x-3 bg-[#111] p-4 rounded-xl border border-zinc-800 cursor-pointer">
            <input 
              type="checkbox" 
              checked={maintenanceMode} 
              onChange={e => setMaintenanceMode(e.target.checked)}
              className="w-5 h-5 bg-[#111] border-zinc-800 rounded focus:ring-zinc-600"
            />
            <div>
              <span className="block text-sm font-bold text-white">Maintenance Mode</span>
              <span className="block text-xs text-zinc-500">Show a popup to tell users you are working on the app right now.</span>
            </div>
          </label>
          
          <div className="pt-6 border-t border-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">Payment Methods</label>
              <Button size="sm" variant="outline" onClick={() => setPaymentMethods([...paymentMethods, { id: Date.now().toString(), name: '', details: '' }])}>
                <Plus className="w-4 h-4 mr-2" /> Add Method
              </Button>
            </div>
            <div className="space-y-4">
              {paymentMethods.map((pm, i) => (
                <div key={pm.id} className="flex gap-4 items-start">
                  <div className="flex-1 space-y-2">
                    <Input 
                      placeholder="Method Name (e.g. bKash / Nagad)" 
                      value={pm.name}
                      onChange={(e) => {
                        const next = [...paymentMethods];
                        next[i].name = e.target.value;
                        setPaymentMethods(next);
                      }}
                    />
                    <Input 
                      placeholder="Account Details (e.g. 017XXXXXX Personal)" 
                      value={pm.details}
                      onChange={(e) => {
                        const next = [...paymentMethods];
                        next[i].details = e.target.value;
                        setPaymentMethods(next);
                      }}
                    />
                  </div>
                  <Button variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-950/30 px-3 h-10 mt-1" onClick={() => {
                    setPaymentMethods(paymentMethods.filter(p => p.id !== pm.id));
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {paymentMethods.length === 0 && (
                <p className="text-zinc-500 text-sm font-medium">No payment methods added. Users won't see any deposit options.</p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-900">
          <h2 className="text-lg font-black text-white mb-4">Auto Topup API Configuration</h2>
          <p className="text-xs text-zinc-500 mb-6 font-medium">Configure credentials for external Topup APIs. These can be used in product configurations.</p>
          
          <div className="space-y-6">
            <div className="bg-[#111] p-5 rounded-2xl border border-zinc-800 space-y-4">
              <h3 className="font-bold text-zinc-300 flex items-center gap-2">Free Fire API</h3>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">API URL</label>
                <Input 
                  value={freeFireApiUrl} 
                  onChange={e => setFreeFireApiUrl(e.target.value)} 
                  placeholder="e.g. https://api.example.com/ff"
                  className="bg-black border-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">API Key</label>
                <Input 
                  value={freeFireApiKey} 
                  onChange={e => setFreeFireApiKey(e.target.value)} 
                  placeholder="Enter API Key"
                  type="password"
                  className="bg-black border-zinc-900"
                />
              </div>
            </div>

            <div className="bg-[#111] p-5 rounded-2xl border border-zinc-800 space-y-4">
              <h3 className="font-bold text-zinc-300 flex items-center gap-2">Garena Shell API</h3>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">API URL</label>
                <Input 
                  value={garenaShellApiUrl} 
                  onChange={e => setGarenaShellApiUrl(e.target.value)} 
                  placeholder="e.g. https://api.example.com/garena"
                  className="bg-black border-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">API Key</label>
                <Input 
                  value={garenaShellApiKey} 
                  onChange={e => setGarenaShellApiKey(e.target.value)} 
                  placeholder="Enter API Key"
                  type="password"
                  className="bg-black border-zinc-900"
                />
              </div>
            </div>

            <div className="bg-[#111] p-5 rounded-2xl border border-zinc-800 space-y-4">
              <h3 className="font-bold text-zinc-300 flex items-center gap-2">Unipin API</h3>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">API URL</label>
                <Input 
                  value={unipinApiUrl} 
                  onChange={e => setUnipinApiUrl(e.target.value)} 
                  placeholder="e.g. https://api.example.com/unipin"
                  className="bg-black border-zinc-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">API Key</label>
                <Input 
                  value={unipinApiKey} 
                  onChange={e => setUnipinApiKey(e.target.value)} 
                  placeholder="Enter API Key"
                  type="password"
                  className="bg-black border-zinc-900"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-900 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-[320px] md:max-w-sm overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10 bg-black/20 rounded-full p-1 backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>
            
            {dailyPopupImage && (
              <div className="w-full h-32 md:h-48 bg-zinc-900">
                <img src={dailyPopupImage} alt="Popup" className="w-full h-full object-cover" />
              </div>
            )}

            <div className={`p-6 md:p-8 text-center flex flex-col items-center ${dailyPopupImage ? 'pt-5 md:pt-6' : ''}`}>
              {!dailyPopupImage && (
                <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-500/20 text-indigo-500 rounded-full flex items-center justify-center mb-4 md:mb-6">
                  <Bell className="w-6 h-6 md:w-8 md:h-8" />
                </div>
              )}
              
              <h2 className="text-lg md:text-xl font-bold text-white mb-2">{dailyPopupTitle || "Notice"}</h2>
              {dailyPopupMessage && (
                <p className="text-xs md:text-sm text-zinc-400 mb-6 md:mb-8 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                  {dailyPopupMessage}
                </p>
              )}
              
              <div className="w-full space-y-2 md:space-y-3">
                {dailyPopupLink && (
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 md:py-3.5 rounded-xl transition-colors tracking-wide text-sm md:text-base"
                  >
                    {dailyPopupLinkLabel || "Learn More"}
                  </button>
                )}
                <button 
                  onClick={() => setShowPreview(false)}
                  className="w-full bg-transparent hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 font-bold py-3 md:py-3.5 rounded-xl transition-colors text-xs md:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
