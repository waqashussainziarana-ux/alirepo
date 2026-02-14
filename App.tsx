
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import SessionWarningModal from './components/SessionWarningModal';
import { cloudFetch, cloudSave } from './services/vercelDb';
import { sessionService, getDeviceId } from './services/sessionService';
import { useSessionSecurity } from './hooks/useSessionSecurity';

type View = 'customers' | 'items' | 'settings';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return window.sessionStorage.getItem('daily-transactions-user');
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Use refs to track latest state for async sync functions
  const customersRef = useRef<Customer[]>([]);
  const itemsRef = useRef<Item[]>([]);
  
  useEffect(() => { customersRef.current = customers; }, [customers]);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('customers');
  const [showUpdate, setShowUpdate] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Security Logout Handler
  const handleForceLogout = useCallback((reason: string) => {
    alert(reason);
    setCurrentUser(null);
    window.sessionStorage.removeItem('daily-transactions-user');
    setCustomers([]);
    setItems([]);
  }, []);

  // Multi-device security management
  const { showWarning, setShowWarning, terminateIdle, idleCount, triggerManualCheck } = useSessionSecurity(currentUser, handleForceLogout);

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
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  /**
   * Data Merging Logic
   */
  const mergeData = <T extends { id: string }>(local: T[], remote: T[], mergeChildTransactions = false): T[] => {
    const mergedMap = new Map<string, T>();
    remote.forEach(item => mergedMap.set(item.id, item));
    local.forEach(localItem => {
      const remoteItem = mergedMap.get(localItem.id);
      if (remoteItem && mergeChildTransactions) {
        const mergedTransactions = mergeData(
          (localItem as any).transactions || [], 
          (remoteItem as any).transactions || []
        );
        mergedMap.set(localItem.id, { ...localItem, transactions: mergedTransactions });
      } else {
        mergedMap.set(localItem.id, localItem);
      }
    });
    return Array.from(mergedMap.values());
  };

  /**
   * Enhanced Core Sync Logic
   */
  const syncData = useCallback(async (currentLocalCustomers: Customer[], currentLocalItems: Item[]) => {
    if (!currentUser) return false;
    
    setIsSyncing(true);
    // Safety timeout to clear syncing state if it hangs
    const failsafe = setTimeout(() => setIsSyncing(false), 15000);

    try {
      const [remoteCustomers, remoteItems] = await Promise.all([
        cloudFetch(currentUser, 'customers'),
        cloudFetch(currentUser, 'items')
      ]);

      const finalCustomers = mergeData(currentLocalCustomers, remoteCustomers || [], true);
      const finalItems = mergeData(currentLocalItems, remoteItems || []);

      setCustomers(finalCustomers);
      setItems(finalItems);
      
      localStorage.setItem(`daily-transactions-customers-${currentUser}`, JSON.stringify(finalCustomers));
      localStorage.setItem(`daily-transactions-items-${currentUser}`, JSON.stringify(finalItems));

      await Promise.all([
        cloudSave(currentUser, 'customers', finalCustomers),
        cloudSave(currentUser, 'items', finalItems)
      ]);

      setLastSynced(new Date().toLocaleTimeString());
      triggerManualCheck();
      clearTimeout(failsafe);
      setIsSyncing(false);
      return true;
    } catch (e) {
      console.warn("Real-time merge failed.", e);
      setIsSyncing(false);
      clearTimeout(failsafe);
      return false;
    }
  }, [currentUser, triggerManualCheck]);

  // Initial Data Load
  useEffect(() => {
    const loadGlobalData = async () => {
      if (!currentUser) return;
      setIsSyncing(true);
      try {
        const [cloudCustomers, cloudItems] = await Promise.all([
          cloudFetch(currentUser, 'customers'),
          cloudFetch(currentUser, 'items')
        ]);
        setCustomers(cloudCustomers || []);
        setItems(cloudItems || []);
        setLastSynced(new Date().toLocaleTimeString());
      } catch (e) {
        console.error("Initial cloud sync failed.", e);
      } finally {
        setIsSyncing(false);
      }
    };
    loadGlobalData();
  }, [currentUser]);

  /**
   * Background Auto-Sync
   */
  useEffect(() => {
    if (!currentUser) return;

    const autoSync = () => {
      syncData(customersRef.current, itemsRef.current);
    };

    const interval = setInterval(autoSync, 45000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        autoSync();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [currentUser, syncData]);

  const handleManualSync = async () => {
    if (isSyncing) return;
    const success = await syncData(customersRef.current, itemsRef.current);
    if (success) {
       console.log("Manual refresh completed successfully.");
    }
  };

  const handleLogin = async (username: string) => {
    try {
      await sessionService.ping(username);
    } catch (e) {
      console.warn("Session ping failed during login.");
    }
    setCurrentUser(username);
    window.sessionStorage.setItem('daily-transactions-user', username);
  };
  
  const handleLogout = async () => {
    if(confirm("Logout? Make sure 'READY' is visible to ensure data safety.")) {
      if (currentUser) {
        await sessionService.logout(currentUser).catch(console.warn);
      }
      setCurrentUser(null);
      window.sessionStorage.removeItem('daily-transactions-user');
      setCustomers([]);
      setItems([]);
      setSelectedCustomerId(null);
      setActiveView('customers');
    }
  };

  // Actions
  const handleAddCustomer = (name: string, phone: string) => {
    const newCustomer: Customer = { id: crypto.randomUUID(), name, phone, transactions: [] };
    const nextState = [...customers, newCustomer];
    setCustomers(nextState);
    syncData(nextState, items);
  };

  const handleEditCustomer = (id: string, name: string, phone: string) => {
    const nextState = customers.map(c => c.id === id ? { ...c, name, phone } : c);
    setCustomers(nextState);
    syncData(nextState, items);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const nextState = customers.filter(c => c.id !== customerId);
    setCustomers(nextState);
    syncData(nextState, items);
    if (selectedCustomerId === customerId) setSelectedCustomerId(null);
  };

  const handleAddItem = (name: string, price: number, unit: string): Item => {
    const newItem: Item = { id: crypto.randomUUID(), name, price, unit };
    const nextItems = [...items, newItem];
    setItems(nextItems);
    syncData(customers, nextItems);
    return newItem;
  };

  const handleEditItem = (item: Item) => {
    const nextItems = items.map(i => i.id === item.id ? item : i);
    setItems(nextItems);
    syncData(customers, nextItems);
  };

  const handleDeleteItem = (id: string) => {
    const nextItems = items.filter(i => i.id !== id);
    setItems(nextItems);
    syncData(customers, nextItems);
  };

  const handleAddMultipleItems = (newItems: Array<Omit<Item, 'id'>>) => {
    const itemsWithIds = newItems.map(i => ({ ...i, id: crypto.randomUUID() }));
    const nextItems = [...items, ...itemsWithIds];
    setItems(nextItems);
    syncData(customers, nextItems);
  };

  const handleAddTransaction = (customerId: string, transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = { 
        ...transaction, 
        id: crypto.randomUUID(), 
        date: (transaction as any).date || new Date().toISOString() 
    };
    const nextState = customers.map(c => c.id === customerId ? { ...c, transactions: [newTransaction, ...c.transactions] } : c);
    setCustomers(nextState);
    syncData(nextState, items);
  };

  const handleEditTransaction = (customerId: string, updatedTx: Transaction) => {
    const nextState = customers.map(c => 
      c.id === customerId ? { ...c, transactions: c.transactions.map(t => t.id === updatedTx.id ? updatedTx : t) } : c
    );
    setCustomers(nextState);
    syncData(nextState, items);
  };

  const handleDeleteTransaction = (customerId: string, txId: string) => {
    const nextState = customers.map(c => 
      c.id === customerId ? { ...c, transactions: c.transactions.filter(t => t.id !== txId) } : c
    );
    setCustomers(nextState);
    syncData(nextState, items);
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
          onRefresh={handleManualSync}
          isSyncing={isSyncing}
        />
        
        <main className="p-4 flex-grow pb-24">
          <div className="flex justify-between items-center mb-4 px-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(22,163,74,0.6)] animate-pulse`}></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-success">
                 SECURE SESSION ({getDeviceId().slice(0, 4)})
               </span>
            </div>
            <div className="text-[9px] font-bold text-slate-400">
              {isSyncing ? 'SYNCING...' : lastSynced ? `LATEST: ${lastSynced}` : 'READY'}
            </div>
          </div>

          {selectedCustomer ? (
            <CustomerDetail 
              customer={selectedCustomer} 
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              allItems={items} 
              onAddItem={handleAddItem}
              onRefresh={handleManualSync}
              isSyncing={isSyncing}
            />
          ) : (
            <>
              {activeView === 'customers' && (
                <CustomerList 
                  customers={customers} 
                  onSelectCustomer={setSelectedCustomerId} 
                  onAddCustomer={handleAddCustomer} 
                  onEditCustomer={handleEditCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onRefresh={handleManualSync}
                  isSyncing={isSyncing}
                />
              )}
              {activeView === 'items' && (
                <ItemsList 
                  items={items} 
                  onAddItem={handleAddItem} 
                  onEditItem={handleEditItem} 
                  onDeleteItem={handleDeleteItem} 
                  onAddMultipleItems={handleAddMultipleItems} 
                />
              )}
              {activeView === 'settings' && (
                <SettingsPage 
                  onExport={() => {}} onImport={() => {}} onLogout={handleLogout} 
                  currentUser={currentUser} onInstallClick={handleInstallClick}
                  isInstallable={!!deferredPrompt} isInstalled={isInstalled} isSyncing={isSyncing}
                />
              )}
            </>
          )}
        </main>
        
        {showInstallBanner && !isInstalled && (
          <InstallBanner onInstall={handleInstallClick} onDismiss={() => setShowInstallBanner(false)} />
        )}

        <SessionWarningModal 
          isOpen={showWarning} 
          onClose={() => setShowWarning(false)} 
          onConfirm={terminateIdle} 
          count={idleCount} 
        />

        <UpdateNotification show={showUpdate} onUpdate={() => window.location.reload()} />
        {!selectedCustomer && <BottomNav activeView={activeView} setActiveView={setActiveView} />}
      </div>
    </div>
  );
};

export default App;
