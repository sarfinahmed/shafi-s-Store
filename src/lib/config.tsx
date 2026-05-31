import React, { createContext, useContext, useEffect, useState } from "react";
import { db, AppSettings } from "./db";

interface ConfigContextType {
  settings: AppSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const s = await db.getSettings();
    setSettings(s);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await db.updateSettings(newSettings);
    setSettings(updated);
  };

  return (
    <ConfigContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, updateSettings }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
