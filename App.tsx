
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Transaction, TransactionType, Item, TransactionItem } from './types';
import CustomerList from './components/CustomerList';
import CustomerDetail from './components/CustomerDetail';
import Header from './components/Header';
import ItemsList from './components/ItemsList';
import BottomNav from './components/BottomNav';
import SettingsPage from './components/SettingsPage';
import AuthPage from './components/AuthPage';
import UpdateNotification from './components/UpdateNotification';
import InstallBanner from './components/InstallBanner';
import { cloudFetch, cloudSave, isVercelEnabled } from './services/vercelDb';

type View = 'customers' | 'items' | 'settings';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return window.sessionStorage.getItem('daily-transactions-user');
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('customers');
  const [showUpdate, setShowUpdate] = useState(false);

  // PWA Install States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      setIsInstalled(true);
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  // Auto-Login Sync
  useEffect(() => {
    const loadGlobalData = async () => {
      if (!currentUser) return;
      setIsSyncing(true);
      
      try {
        const [cloudCustomers, cloudItems] = await Promise.all([
          cloudFetch(currentUser, 'customers'),
          cloudFetch(currentUser, 'items')
        ]);
        
        let finalCustomers = cloudCustomers || [];
        let finalItems = cloudItems || [];

        if (finalCustomers.length === 0) {
          const local = localStorage.getItem(`daily-transactions-customers-${currentUser}`);
          if (local) finalCustomers = JSON.parse(local);
        }
        if (finalItems.length === 0) {
          const local = localStorage.getItem(`daily-transactions-items-${currentUser}`);
          if (local) finalItems = JSON.parse(local);
        }

        setCustomers(finalCustomers);
        setItems(finalItems);
        setLastSynced(new Date().toLocaleTimeString());
      } catch (e) {
        console.error("Critical: Initial cloud sync failed.", e);
      } finally {
        setIsSyncing(false);
      }
    };

    loadGlobalData();
  }, [currentUser]);

  // Background Persistence
  useEffect(() => {
    if (!currentUser) return;

    const autoSync = async () => {
      localStorage.setItem(`daily-transactions-customers-${currentUser}`, JSON.stringify(customers));
      localStorage.setItem(`daily-transactions-items-${currentUser}`, JSON.stringify(items));

      setIsSyncing(true);
      try {
        await Promise.all([
          cloudSave(currentUser, 'customers', customers),
          cloudSave(currentUser, 'items', items)
        ]);
        setLastSynced(new Date().toLocaleTimeString());
      } catch (e) {
        console.warn("Auto-sync to Supabase failed.");
      } finally {
        setIsSyncing(false);
      }
    };

    const timer = setTimeout(autoSync, 2000);
    return () => clearTimeout(timer);
  }, [customers, items, currentUser]);

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    window.sessionStorage.setItem('daily-transactions-user', username);
  };
  
  const handleLogout = () => {
    if(confirm("Logout? Make sure you see 'Sync Complete' to ensure your data is on the cloud.")) {
      setCurrentUser(null);
      window.sessionStorage.removeItem('daily-transactions-user');
      setCustomers([]);
      setItems([]);
      setSelectedCustomerId(null);
      setActiveView('customers');
    }
  };

  const handleExport = () => {
    const data = {
      version: '4.5',
      user: currentUser,
      exportedAt: new Date().toISOString(),
      customers,
      items
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${currentUser}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.customers || !Array.isArray(json.customers)) {
          throw new Error("Invalid backup file: Missing customers data.");
        }

        if (confirm("This will overwrite your current device data with the file content. Continue?")) {
          setCustomers(json.customers);
          if (json.items && Array.isArray(json.items)) {
            setItems(json.items);
          }
          alert("Backup restored successfully! Syncing to cloud...");
        }
      } catch (err) {
        alert("Error importing file: " + (err instanceof Error ? err.message : "Unknown error"));
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleAddCustomer = (name: string, phone: string) => {
    const newCustomer: Customer = { id: crypto.randomUUID(), name, phone, transactions: [] };
    setCustomers(prev => [...prev, newCustomer]);
  };

  const handleAddItem = (name: string, price: number, unit: string): Item => {
    const newItem: Item = { id: crypto.randomUUID(), name, price, unit };
    setItems(prev => [...prev, newItem]);
    return newItem;
  };

  const handleEditItem = (updatedItem: Item) => {
    setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddMultipleItems = (itemsToAdd: Array<Omit<Item, 'id'>>) => {
    const newItems: Item[] = itemsToAdd.map(item => ({ ...item, id: crypto.randomUUID() }));
    setItems(prev => [...prev, ...newItems]);
  };

  const handleAddTransaction = (customerId: string, transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = { 
        ...transaction, 
        id: crypto.randomUUID(), 
        date: (transaction as any).date || new Date().toISOString() 
    };
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, transactions: [newTransaction, ...c.transactions] } : c));
  };

  const handleEditTransaction = (customerId: string, updatedTransaction: Transaction) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? {
      ...c,
      transactions: c.transactions.map(tx => tx.id === updatedTransaction.id ? updatedTransaction : tx)
    } : c));
  };

  const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId) || null, [customers, selectedCustomerId]);
  
  if (!currentUser) return <AuthPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="container mx-auto max-w-2xl bg-white min-h-screen shadow-lg relative flex flex-col">
        <Header 
          customerName={selectedCustomer?.name} 
          onBack={selectedCustomer ? () => setSelectedCustomerId(null) : undefined}
          activeView={activeView}
          showInstallButton={!!deferredPrompt && !isInstalled}
          onInstallClick={handleInstallClick}
        />
        
        <main className="p-4 flex-grow pb-24">
          <div className="flex justify-between items-center mb-4 px-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(22,163,74,0.6)] animate-pulse`}></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-success">
                 SUPABASE CLOUD LINKED
               </span>
            </div>
            <div className="text-[9px] font-bold text-slate-400">
              {isSyncing ? 'SYNCING...' : lastSynced ? `LAST SYNC: ${lastSynced}` : 'READY'}
            </div>
          </div>

          {selectedCustomer ? (
            <CustomerDetail 
              customer={selectedCustomer} 
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              allItems={items} 
              onAddItem={handleAddItem}
            />
          ) : (
            <>
              {activeView === 'customers' && <CustomerList customers={customers} onSelectCustomer={setSelectedCustomerId} onAddCustomer={handleAddCustomer} />}
              {activeView === 'items' && <ItemsList items={items} onAddItem={handleAddItem} onEditItem={handleEditItem} onDeleteItem={handleDeleteItem} onAddMultipleItems={handleAddMultipleItems} />}
              {activeView === 'settings' && <SettingsPage 
                onExport={handleExport} onImport={handleImport} onLogout={handleLogout} 
                currentUser={currentUser} onInstallClick={handleInstallClick}
                isInstallable={!!deferredPrompt} isInstalled={isInstalled} isSyncing={isSyncing}
              />}
            </>
          )}
        </main>
        
        {showInstallBanner && !isInstalled && (
          <InstallBanner 
            onInstall={handleInstallClick} 
            onDismiss={() => setShowInstallBanner(false)} 
          />
        )}

        <UpdateNotification show={showUpdate} onUpdate={() => window.location.reload()} />
        {!selectedCustomer && <BottomNav activeView={activeView} setActiveView={setActiveView} />}
      </div>
    </div>
  );
};

export default App;
