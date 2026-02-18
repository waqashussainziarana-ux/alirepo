
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
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const customersRef = useRef<Customer[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const deletedIdsRef = useRef<string[]>([]);
  
  useEffect(() => { customersRef.current = customers; }, [customers]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { deletedIdsRef.current = deletedIds; }, [deletedIds]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('customers');
  const [showUpdate, setShowUpdate] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const handleForceLogout = useCallback((reason: string) => {
    alert(reason);
    setCurrentUser(null);
    window.sessionStorage.removeItem('daily-transactions-user');
    setCustomers([]);
    setItems([]);
  }, []);

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
      if (!window.matchMedia('(display-mode: standalone)').matches) setShowInstallBanner(true);
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
   * Deep Merging Logic:evaluates transactions individually
   */
  const mergeCustomers = useCallback((local: Customer[], remote: Customer[], tombstones: Set<string>): Customer[] => {
    const mergedMap = new Map<string, Customer>();

    const mergeTransactions = (localTx: Transaction[], remoteTx: Transaction[]): Transaction[] => {
      const txMap = new Map<string, Transaction>();
      
      // Evaluation helper
      const process = (tx: Transaction) => {
        if (tombstones.has(tx.id)) return; // ABSOLUTE DELETE
        const existing = txMap.get(tx.id);
        if (!existing || new Date(tx.updatedAt || 0).getTime() > new Date(existing.updatedAt || 0).getTime()) {
          txMap.set(tx.id, tx);
        }
      };

      remoteTx.forEach(process);
      localTx.forEach(process);
      
      return Array.from(txMap.values());
    };

    // Process Remote
    remote.forEach(remoteCust => {
      if (tombstones.has(remoteCust.id)) return;
      mergedMap.set(remoteCust.id, remoteCust);
    });

    // Process Local with Deep Transaction Merge
    local.forEach(localCust => {
      if (tombstones.has(localCust.id)) return;

      const remoteCust = mergedMap.get(localCust.id);
      if (!remoteCust) {
        mergedMap.set(localCust.id, localCust);
      } else {
        // Resolve Customer Identity conflicts
        const localTime = new Date(localCust.updatedAt || 0).getTime();
        const remoteTime = new Date(remoteCust.updatedAt || 0).getTime();
        
        const winningBase = localTime >= remoteTime ? localCust : remoteCust;
        
        // Deep merge the actual ledger
        const mergedLedger = mergeTransactions(localCust.transactions || [], remoteCust.transactions || []);
        
        mergedMap.set(localCust.id, {
          ...winningBase,
          transactions: mergedLedger
        });
      }
    });

    return Array.from(mergedMap.values());
  }, []);

  const syncData = useCallback(async (
    currentLocalCustomers: Customer[], 
    currentLocalItems: Item[], 
    currentDeletedIds: string[]
  ) => {
    if (!currentUser) return false;
    setIsSyncing(true);
    const failsafe = setTimeout(() => setIsSyncing(false), 15000);

    try {
      const [remoteCustomers, remoteItems, remoteDeleted] = await Promise.all([
        cloudFetch(currentUser, 'customers'),
        cloudFetch(currentUser, 'items'),
        cloudFetch(currentUser, 'deleted_ids')
      ]);

      const globalTombSet = new Set([...currentDeletedIds, ...(remoteDeleted || [])]);
      const globalTombstones = Array.from(globalTombSet);

      const finalCustomers = mergeCustomers(currentLocalCustomers, remoteCustomers || [], globalTombSet);
      
      // Basic merge for catalog items
      const itemMap = new Map<string, Item>();
      [...(remoteItems || []), ...currentLocalItems].forEach(item => {
        if (globalTombSet.has(item.id)) return;
        const existing = itemMap.get(item.id);
        if (!existing || new Date(item.updatedAt || 0).getTime() > new Date(existing.updatedAt || 0).getTime()) {
          itemMap.set(item.id, item);
        }
      });
      const finalItems = Array.from(itemMap.values());

      setCustomers(finalCustomers);
      setItems(finalItems);
      setDeletedIds(globalTombstones);
      
      localStorage.setItem(`daily-transactions-customers-${currentUser}`, JSON.stringify(finalCustomers));
      localStorage.setItem(`daily-transactions-items-${currentUser}`, JSON.stringify(finalItems));
      localStorage.setItem(`daily-transactions-deleted-${currentUser}`, JSON.stringify(globalTombstones));

      await Promise.all([
        cloudSave(currentUser, 'customers', finalCustomers),
        cloudSave(currentUser, 'items', finalItems),
        cloudSave(currentUser, 'deleted_ids', globalTombstones)
      ]);

      setLastSynced(new Date().toLocaleTimeString());
      triggerManualCheck();
      clearTimeout(failsafe);
      setIsSyncing(false);
      return true;
    } catch (e) {
      console.warn("Sync failed.", e);
      setIsSyncing(false);
      clearTimeout(failsafe);
      return false;
    }
  }, [currentUser, mergeCustomers, triggerManualCheck]);

  useEffect(() => {
    const loadGlobalData = async () => {
      if (!currentUser) return;
      setIsSyncing(true);
      try {
        const [cloudCustomers, cloudItems, cloudDeleted] = await Promise.all([
          cloudFetch(currentUser, 'customers'),
          cloudFetch(currentUser, 'items'),
          cloudFetch(currentUser, 'deleted_ids')
        ]);
        
        const tombstones = cloudDeleted || [];
        const tombSet = new Set(tombstones);

        const sanitizedCustomers = (cloudCustomers || []).filter((c: Customer) => !tombSet.has(c.id)).map((c: Customer) => ({
          ...c,
          transactions: (c.transactions || []).filter(tx => !tombSet.has(tx.id))
        }));

        setCustomers(sanitizedCustomers);
        setItems((cloudItems || []).filter((i: Item) => !tombSet.has(i.id)));
        setDeletedIds(tombstones);
        setLastSynced(new Date().toLocaleTimeString());
      } catch (e) {
        console.error("Initial load failed.", e);
      } finally {
        setIsSyncing(false);
      }
    };
    loadGlobalData();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const autoSync = () => syncData(customersRef.current, itemsRef.current, deletedIdsRef.current);
    const interval = setInterval(autoSync, 45000);
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') autoSync(); };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [currentUser, syncData]);

  const handleManualSync = () => { if (!isSyncing) syncData(customersRef.current, itemsRef.current, deletedIdsRef.current); };

  const handleLogin = async (username: string) => {
    try { await sessionService.ping(username); } catch (e) {}
    setCurrentUser(username);
    window.sessionStorage.setItem('daily-transactions-user', username);
  };
  
  const handleLogout = async () => {
    if(confirm("Logout?")) {
      if (currentUser) await sessionService.logout(currentUser).catch(console.warn);
      setCurrentUser(null);
      window.sessionStorage.removeItem('daily-transactions-user');
      setCustomers([]);
      setItems([]);
      setDeletedIds([]);
      setSelectedCustomerId(null);
      setActiveView('customers');
    }
  };

  // --- ACTIONS WITH DEEP TIMESTAMPS ---

  const handleAddCustomer = (name: string, phone: string) => {
    const newCustomer: Customer = { 
      id: crypto.randomUUID(), 
      name, 
      phone, 
      transactions: [], 
      updatedAt: new Date().toISOString() 
    };
    const nextState = [...customers, newCustomer];
    setCustomers(nextState);
    syncData(nextState, items, deletedIds);
  };

  const handleEditCustomer = (id: string, name: string, phone: string) => {
    const nextState = customers.map(c => c.id === id ? { ...c, name, phone, updatedAt: new Date().toISOString() } : c);
    setCustomers(nextState);
    syncData(nextState, items, deletedIds);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const nextState = customers.filter(c => c.id !== customerId);
    const nextDeleted = [...deletedIds, customerId];
    setCustomers(nextState);
    setDeletedIds(nextDeleted);
    syncData(nextState, items, nextDeleted);
    if (selectedCustomerId === customerId) setSelectedCustomerId(null);
  };

  const handleAddItem = (name: string, price: number, unit: string): Item => {
    const newItem: Item = { id: crypto.randomUUID(), name, price, unit, updatedAt: new Date().toISOString() };
    const nextItems = [...items, newItem];
    setItems(nextItems);
    syncData(customers, nextItems, deletedIds);
    return newItem;
  };

  const handleEditItem = (item: Item) => {
    const updatedItem = { ...item, updatedAt: new Date().toISOString() };
    const nextItems = items.map(i => i.id === item.id ? updatedItem : i);
    setItems(nextItems);
    syncData(customers, nextItems, deletedIds);
  };

  const handleDeleteItem = (id: string) => {
    const nextItems = items.filter(i => i.id !== id);
    const nextDeleted = [...deletedIds, id];
    setItems(nextItems);
    setDeletedIds(nextDeleted);
    syncData(customers, nextItems, nextDeleted);
  };

  const handleAddMultipleItems = (newItems: Array<Omit<Item, 'id'>>) => {
    const stamp = new Date().toISOString();
    const itemsWithIds = newItems.map(i => ({ ...i, id: crypto.randomUUID(), updatedAt: stamp }));
    const nextItems = [...items, ...itemsWithIds];
    setItems(nextItems);
    syncData(customers, nextItems, deletedIds);
  };

  const handleAddTransaction = (customerId: string, transaction: Omit<Transaction, 'id' | 'date' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTransaction: Transaction = { 
        ...transaction, 
        id: crypto.randomUUID(), 
        date: (transaction as any).date || now,
        updatedAt: now
    };
    const nextState = customers.map(c => 
      c.id === customerId ? { ...c, transactions: [newTransaction, ...c.transactions], updatedAt: now } : c
    );
    setCustomers(nextState);
    syncData(nextState, items, deletedIds);
  };

  const handleEditTransaction = (customerId: string, updatedTx: Transaction) => {
    const now = new Date().toISOString();
    const nextTx = { ...updatedTx, updatedAt: now };
    const nextState = customers.map(c => 
      c.id === customerId ? { 
        ...c, 
        transactions: c.transactions.map(t => t.id === updatedTx.id ? nextTx : t),
        updatedAt: now 
      } : c
    );
    setCustomers(nextState);
    syncData(nextState, items, deletedIds);
  };

  const handleDeleteTransaction = (customerId: string, txId: string) => {
    const now = new Date().toISOString();
    const nextDeleted = [...deletedIds, txId];
    const nextState = customers.map(c => 
      c.id === customerId ? { 
        ...c, 
        transactions: c.transactions.filter(t => t.id !== txId),
        updatedAt: now 
      } : c
    );
    setCustomers(nextState);
    setDeletedIds(nextDeleted);
    syncData(nextState, items, nextDeleted);
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
