
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Customer, Transaction, TransactionType, Item } from './types';
import CustomerList from './components/CustomerList';
import CustomerDetail from './components/CustomerDetail';
import Header from './components/Header';
import ItemsList from './components/ItemsList';
import BottomNav from './components/BottomNav';
import SettingsPage from './components/SettingsPage';
import AuthPage from './components/AuthPage';
import UpdateNotification from './components/UpdateNotification';
import InstallBanner from './components/InstallBanner';
import ConfirmationModal from './components/ConfirmationModal';
import { cloudFetch, cloudSave } from './services/vercelDb';
import { RefreshIcon } from './components/icons/RefreshIcon';

type View = 'customers' | 'items' | 'settings';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return window.sessionStorage.getItem('daily-transactions-user');
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncError, setSyncError] = useState<boolean | 'AUTH'>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false); 
  
  const [hasSyncedAtLeastOnce, setHasSyncedAtLeastOnce] = useState(false);
  const localTimestampRef = useRef<number>(Number(localStorage.getItem('dt_last_updated') || '0'));

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('customers');
  const [showUpdate, setShowUpdate] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  const getStorageKey = (key: string) => `dt_v45_${key}_${currentUser?.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const loadData = useCallback(async (isManual = false) => {
    if (!currentUser) return;
    setIsSyncing(true);
    setSyncError(false);

    const localC = localStorage.getItem(getStorageKey('customers'));
    const localI = localStorage.getItem(getStorageKey('items'));
    if (!isInitialized) {
      if (localC) setCustomers(JSON.parse(localC));
      if (localI) setItems(JSON.parse(localI));
    }

    try {
      const [cloudC, cloudI] = await Promise.all([
        cloudFetch(currentUser, 'customers'),
        cloudFetch(currentUser, 'items')
      ]);

      if (cloudC === null || cloudI === null) {
        // null specifically signals an auth failure or unrecoverable error in our updated service
        setSyncError('AUTH');
        throw new Error("Cloud auth error");
      }

      const cloudTs = cloudC?.ts || 0;
      const isCloudNewer = cloudTs > localTimestampRef.current;

      if (isManual || isCloudNewer || !isDirty) {
        if (cloudC && cloudC.data) {
          setCustomers(cloudC.data);
          localTimestampRef.current = cloudTs;
        }
        if (cloudI && cloudI.data) {
          setItems(cloudI.data);
        }
      }

      setHasSyncedAtLeastOnce(true);
      setLastSynced(new Date().toLocaleTimeString());
      setSyncError(false);
    } catch (e: any) {
      if (e.message !== "Cloud auth error") {
        setSyncError(true);
      }
    } finally {
      setIsInitialized(true);
      setIsSyncing(false);
    }
  }, [currentUser, isInitialized, isDirty]);

  useEffect(() => {
    if (currentUser && !isInitialized) {
      loadData();
    }
  }, [currentUser, loadData, isInitialized]);

  useEffect(() => {
    if (!currentUser || !isInitialized) return;
    localStorage.setItem(getStorageKey('customers'), JSON.stringify(customers));
    localStorage.setItem(getStorageKey('items'), JSON.stringify(items));
    localStorage.setItem('dt_last_updated', localTimestampRef.current.toString());
  }, [customers, items, currentUser, isInitialized]);

  useEffect(() => {
    if (!currentUser || !isInitialized || !isDirty || !hasSyncedAtLeastOnce || syncError === 'AUTH') return;

    const autoSync = async () => {
      setIsSyncing(true);
      try {
        const now = Date.now();
        const results = await Promise.all([
          cloudSave(currentUser, 'customers', customers),
          cloudSave(currentUser, 'items', items)
        ]);
        
        if (results.some(r => r === null)) {
          setSyncError('AUTH');
          return;
        }

        localTimestampRef.current = now;
        localStorage.setItem('dt_last_updated', now.toString());
        
        setLastSynced(new Date().toLocaleTimeString());
        setSyncError(false);
        setIsDirty(false);
      } catch (e) {
        setSyncError(true);
      } finally {
        setIsSyncing(false);
      }
    };

    const timer = setTimeout(autoSync, 3000);
    return () => clearTimeout(timer);
  }, [customers, items, currentUser, isInitialized, isDirty, hasSyncedAtLeastOnce, syncError]);

  const markDirty = () => {
    setIsDirty(true);
    localTimestampRef.current = Date.now();
  };

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    window.sessionStorage.setItem('daily-transactions-user', username);
    setIsInitialized(false);
    setHasSyncedAtLeastOnce(false);
    setIsDirty(false);
    localTimestampRef.current = 0;
  };
  
  const handleLogout = () => setIsLogoutConfirmOpen(true);
  const executeLogout = () => {
    setCurrentUser(null);
    window.sessionStorage.removeItem('daily-transactions-user');
    setCustomers([]);
    setItems([]);
    setSelectedCustomerId(null);
    setActiveView('customers');
    setIsInitialized(false);
    setHasSyncedAtLeastOnce(false);
    setIsLogoutConfirmOpen(false);
  };

  const handleAddCustomer = (name: string, phone: string) => {
    const newId = crypto.randomUUID();
    setCustomers(prev => [...prev, { id: newId, name, phone, transactions: [] }]);
    markDirty();
  };

  const handleEditCustomer = (id: string, name: string, phone: string) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, name, phone } : c));
    markDirty();
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (selectedCustomerId === id) setSelectedCustomerId(null);
    markDirty();
  };

  const handleAddItem = (name: string, price: number, unit: string): Item => {
    const newItem: Item = { id: crypto.randomUUID(), name, price, unit };
    setItems(prev => [...prev, newItem]);
    markDirty();
    return newItem;
  };

  const handleEditItem = (item: Item) => {
    setItems(prev => prev.map(i => i.id === item.id ? item : i));
    markDirty();
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    markDirty();
  };

  const handleAddMultipleItems = (itemsToAdd: any[]) => {
    setItems(prev => [...prev, ...itemsToAdd.map(i => ({ ...i, id: crypto.randomUUID() }))]);
    markDirty();
  };

  const handleAddTransaction = (customerId: string, tx: any) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { 
      ...c, 
      transactions: [{ ...tx, id: crypto.randomUUID(), date: new Date().toISOString() }, ...c.transactions] 
    } : c));
    markDirty();
  };

  const handleEditTransaction = (customerId: string, tx: Transaction) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { 
      ...c, 
      transactions: c.transactions.map(t => t.id === tx.id ? tx : t) 
    } : c));
    markDirty();
  };

  const handleDeleteTransaction = (customerId: string, tid: string) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { 
      ...c, 
      transactions: c.transactions.filter(t => t.id !== tid) 
    } : c));
    markDirty();
  };

  const selectedCustomer = useMemo(() => {
    if (!Array.isArray(customers)) return null;
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);
  
  if (!currentUser) return <AuthPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="container mx-auto max-w-2xl bg-white min-h-screen shadow-lg relative flex flex-col">
        <Header 
          customerName={selectedCustomer?.name} 
          onBack={selectedCustomer ? () => setSelectedCustomerId(null) : undefined}
          activeView={activeView}
          showInstallButton={!!deferredPrompt && !isInstalled}
          onInstallClick={() => deferredPrompt?.prompt()}
          isSyncing={isSyncing}
          syncError={!!syncError}
        />
        
        <main className="p-4 flex-grow pb-24">
          <div className={`flex justify-between items-center mb-4 px-3 py-2.5 rounded-xl border transition-all ${syncError === 'AUTH' ? 'bg-orange-50 border-orange-100' : syncError ? 'bg-red-50 border-red-100 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${syncError === 'AUTH' ? 'bg-orange-400' : syncError ? 'bg-danger animate-pulse' : isSyncing ? 'bg-amber-400 animate-spin' : !hasSyncedAtLeastOnce ? 'bg-slate-300' : isDirty ? 'bg-amber-400' : 'bg-success'}`}></div>
               <span className={`text-[10px] font-black uppercase tracking-widest ${syncError === 'AUTH' ? 'text-orange-600' : syncError ? 'text-danger' : isSyncing ? 'text-amber-600' : !hasSyncedAtLeastOnce ? 'text-slate-400' : isDirty ? 'text-amber-600' : 'text-success'}`}>
                 {syncError === 'AUTH' ? 'Invalid Database Key' : syncError ? 'Network Offline' : isSyncing ? 'Syncing...' : !hasSyncedAtLeastOnce ? 'Connecting...' : isDirty ? 'Local Save Only' : 'Cloud Synchronized'}
               </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase">
                {syncError === 'AUTH' ? 'Sync Disabled' : lastSynced ? `Updated ${lastSynced}` : 'Checking...'}
              </span>
              <button 
                onClick={() => loadData(true)}
                disabled={isSyncing}
                className={`p-1.5 rounded-md transition-all ${syncError ? 'bg-slate-300 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                title="Retry Cloud Connection"
              >
                <RefreshIcon className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {!isInitialized ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Verifying Storage...</p>
            </div>
          ) : selectedCustomer ? (
            <CustomerDetail 
              customer={selectedCustomer} 
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              allItems={Array.isArray(items) ? items : []} 
              onAddItem={handleAddItem}
            />
          ) : (
            <>
              {activeView === 'customers' && (
                <CustomerList 
                  customers={Array.isArray(customers) ? customers : []} 
                  onSelectCustomer={setSelectedCustomerId} 
                  onAddCustomer={handleAddCustomer} 
                  onEditCustomer={handleEditCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                />
              )}
              {activeView === 'items' && <ItemsList items={Array.isArray(items) ? items : []} onAddItem={handleAddItem} onEditItem={handleEditItem} onDeleteItem={handleDeleteItem} onAddMultipleItems={handleAddMultipleItems} />}
              {activeView === 'settings' && <SettingsPage 
                onExport={() => {}} onImport={() => {}} onLogout={handleLogout} 
                currentUser={currentUser} onInstallClick={() => {}}
                isInstallable={!!deferredPrompt} isInstalled={isInstalled} isSyncing={isSyncing}
              />}
            </>
          )}
        </main>
        
        <UpdateNotification show={showUpdate} onUpdate={() => window.location.reload()} />
        {!selectedCustomer && <BottomNav activeView={activeView} setActiveView={setActiveView} />}
        
        <ConfirmationModal 
          isOpen={isLogoutConfirmOpen}
          onClose={() => setIsLogoutConfirmOpen(false)}
          onConfirm={executeLogout}
          title="Sign Out"
          message="Sign out of Daily Transactions? Your data remains secure in your browser even if offline."
        />
      </div>
    </div>
  );
};

export default App;
