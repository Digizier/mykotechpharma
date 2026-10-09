'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type AdminTab = 'overview' | 'products' | 'categories' | 'banners' | 'orders' | 'prescriptions' | 'settings';

interface AdminContextType {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

export const AdminContext = createContext<AdminContextType>({
  activeTab: 'overview',
  setActiveTab: () => {},
});

export const useAdmin = () => useContext(AdminContext);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTabState] = useState<AdminTab>('overview');

  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = `#${tab}`;
    }
  };

  // Sync with initial URL hash if present
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '').replace('-manager', '');
      const validTabs: AdminTab[] = ['overview', 'products', 'categories', 'banners', 'orders', 'prescriptions', 'settings'];
      if (validTabs.includes(hash as AdminTab)) {
        setActiveTabState(hash as AdminTab);
      }
    }
  }, []);

  return (
    <AdminContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </AdminContext.Provider>
  );
}
