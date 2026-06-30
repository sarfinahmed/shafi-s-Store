import React, { useState } from "react";
import { useConfig } from "../lib/config";
import { useAuth } from "../lib/auth";
import { Button, Input, Textarea } from "../components/ui";
import { CheckCircle, Plus, Trash2 } from "lucide-react";
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
      noticeBanner,
      maintenanceMode,
      paymentMethods,
      freeFireApiUrl,
      freeFireApiKey,
      garenaShellApiUrl,
      garenaShellApiKey,
      unipinApiUrl,
      unipinApiKey
    });
    setSaving(false);
    notify("Settings saved successfully");
  };

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-12 max-w-3xl">
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
    </div>
  );
}
