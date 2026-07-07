import React, { useState, useEffect } from 'react';
import { useConfig } from '../lib/config';
import { X, Bell } from 'lucide-react';

export function DailyPopup() {
  const { settings } = useConfig();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (settings?.dailyPopupEnabled === false) return;
    
    // Require either a link or a message to show the popup
    const hasContent = settings?.dailyPopupMessage || settings?.dailyPopupLink;
    if (!hasContent) return;

    const lastSeen = localStorage.getItem('daily_popup_last_seen');
    const now = new Date().getTime();
    
    // 24 hours in milliseconds
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (!lastSeen || now - parseInt(lastSeen) > twentyFourHours) {
      setIsOpen(true);
    }
  }, [settings]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('daily_popup_last_seen', new Date().getTime().toString());
  };

  const handleAction = () => {
    const link = settings?.dailyPopupLink;
    if (link) {
      window.open(link, '_blank');
    }
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-[320px] md:max-w-sm overflow-hidden shadow-2xl relative">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10 bg-black/20 rounded-full p-1 backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>
        
        {settings?.dailyPopupImage && (
          <div className="w-full h-32 md:h-48 bg-zinc-900">
            <img src={settings.dailyPopupImage} alt="Popup" className="w-full h-full object-cover" />
          </div>
        )}

        <div className={`p-6 md:p-8 text-center flex flex-col items-center ${settings?.dailyPopupImage ? 'pt-5 md:pt-6' : ''}`}>
          {!settings?.dailyPopupImage && (
            <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-500/20 text-indigo-500 rounded-full flex items-center justify-center mb-4 md:mb-6">
              <Bell className="w-6 h-6 md:w-8 md:h-8" />
            </div>
          )}
          
          <h2 className="text-lg md:text-xl font-bold text-white mb-2">{settings?.dailyPopupTitle || "Notice"}</h2>
          {settings?.dailyPopupMessage && (
            <p className="text-xs md:text-sm text-zinc-400 mb-6 md:mb-8 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
              {settings.dailyPopupMessage}
            </p>
          )}
          
          <div className="w-full space-y-2 md:space-y-3">
            {settings?.dailyPopupLink && (
              <button 
                onClick={handleAction}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 md:py-3.5 rounded-xl transition-colors tracking-wide text-sm md:text-base"
              >
                {settings?.dailyPopupLinkLabel || "Learn More"}
              </button>
            )}
            <button 
              onClick={handleClose}
              className="w-full bg-transparent hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 font-bold py-3 md:py-3.5 rounded-xl transition-colors text-xs md:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
