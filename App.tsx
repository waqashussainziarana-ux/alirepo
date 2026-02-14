
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
        console.error("Critical: Initial cloud sync failed.", e);
      } finally {
        setIsSyncing(false);
      }
    };
    loadGlobalData();
  }, [currentUser]);

  /**
   * Event-Driven Sync Helper
   * Saves to LocalStorage and Cloud immediately on action.
   */
  const syncData = useCallback(async (updatedCustomers: Customer[], updatedItems: Item[]) => {
    if (!currentUser) return;
    
    // Immediate Local Sync for offline safety
    localStorage.setItem(`daily-transactions-customers-${currentUser}`, JSON.stringify(updatedCustomers));
    localStorage.setItem(`daily-transactions-items-${currentUser}`, JSON.stringify(updatedItems));
    
    // Background Cloud Sync
    setIsSyncing(true);
    try {
      await Promise.all([
        cloudSave(currentUser, 'customers', updatedCustomers),
        cloudSave(currentUser, 'items', updatedItems)
      ]);
      setLastSynced(new Date().toLocaleTimeString());
      triggerManualCheck(); // Refresh session security status
    } catch (e) {
      console.warn("Cloud sync failed. Data is safe locally and will sync on next action.");
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, triggerManualCheck]);

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

  // Data Management: Export/Import
  const handleExport = () => {
    const data = {
      customers,
      items,
      version: '4.5',
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_transactions_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (data.customers && Array.isArray(data.customers)) {
          if (confirm("Restore from backup? This will replace your current device data and update the cloud sync.")) {
            setCustomers(data.customers);
            setItems(data.items || []);
            // Sync the imported data to cloud and local storage
            await syncData(data.customers, data.items || []);
            alert("Backup restored successfully and synced to cloud.");
          }
        } else {
          alert("Invalid backup file format. Could not find transaction data.");
        }
      } catch (err) {
        alert("Error reading backup file. Please ensure it's a valid JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Customer Management Actions
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

  // Item Catalog Actions
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

  // Transaction Ledger Actions
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
              {isSyncing ? 'SYNCING...' : lastSynced ? `LAST SYNC: ${lastSynced}` : 'READY'}
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
                  onExport={handleExport} onImport={handleImport} onLogout={handleLogout} 
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
