
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

  // Auto-Login Sync: Fetches everything from Supabase immediately on login
  useEffect(() => {
    const loadGlobalData = async () => {
      if (!currentUser) return;
      setIsSyncing(true);
      
      try {
        // Step 1: Attempt Cloud Fetch
        const [cloudCustomers, cloudItems] = await Promise.all([
          cloudFetch(currentUser, 'customers'),
          cloudFetch(currentUser, 'items')
        ]);
        
        let finalCustomers = cloudCustomers || [];
        let finalItems = cloudItems || [];

        // Step 2: Fallback to Local Storage if Cloud is empty (Migration helper)
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

  // Background Persistence: Auto-saves to Supabase whenever data changes
  useEffect(() => {
    if (!currentUser) return;

    const autoSync = async () => {
      // 1. Always update local cache for speed
      localStorage.setItem(`daily-transactions-customers-${currentUser}`, JSON.stringify(customers));
      localStorage.setItem(`daily-transactions-items-${currentUser}`, JSON.stringify(items));

      // 2. Push to Supabase
      setIsSyncing(true);
      try {
        await Promise.all([
          cloudSave(currentUser, 'customers', customers),
          cloudSave(currentUser, 'items', items)
        ]);
        setLastSynced(new Date().toLocaleTimeString());
      } catch (e) {
        console.warn("Auto-sync to Supabase failed. Data is still saved locally.");
      } finally {
        setIsSyncing(false);
      }
    };

    const timer = setTimeout(autoSync, 2000); // 2-second debounce to save API calls
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
    const newTransaction: Transaction = { ...transaction, id: crypto.randomUUID(), date: new Date().toISOString() };
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
          showInstallButton={false}
          onInstallClick={() => {}}
        />
        
        <main className="p-4 flex-grow pb-24">
          {/* Cloud Status Indicator */}
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
                onExport={() => {}} onImport={() => {}} onLogout={handleLogout} 
                currentUser={currentUser} onInstallClick={() => {}}
                isInstallable={false} isInstalled={false} isSyncing={isSyncing}
              />}
            </>
          )}
        </main>
        
        <UpdateNotification show={showUpdate} onUpdate={() => window.location.reload()} />
        {!selectedCustomer && <BottomNav activeView={activeView} setActiveView={setActiveView} />}
      </div>
    </div>
  );
};

export default App;
