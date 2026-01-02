
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
  const [cloudReady, setCloudReady] = useState(isVercelEnabled());

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('customers');
  const [showUpdate, setShowUpdate] = useState(false);

  // Initial Data Load on Login
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      setIsSyncing(true);

      const isCloud = isVercelEnabled();
      setCloudReady(isCloud);

      if (isCloud) {
        // Attempt cloud fetch
        const [cloudCustomers, cloudItems] = await Promise.all([
          cloudFetch(currentUser, 'customers'),
          cloudFetch(currentUser, 'items')
        ]);
        
        if (cloudCustomers !== null) setCustomers(cloudCustomers);
        else {
          const local = localStorage.getItem(`daily-transactions-customers-${currentUser}`);
          setCustomers(local ? JSON.parse(local) : []);
        }

        if (cloudItems !== null) setItems(cloudItems);
        else {
          const local = localStorage.getItem(`daily-transactions-items-${currentUser}`);
          setItems(local ? JSON.parse(local) : []);
        }
      } else {
        // Local fallback
        const storedCustomers = localStorage.getItem(`daily-transactions-customers-${currentUser}`);
        setCustomers(storedCustomers ? JSON.parse(storedCustomers) : []);
        const storedItems = localStorage.getItem(`daily-transactions-items-${currentUser}`);
        setItems(storedItems ? JSON.parse(storedItems) : []);
      }
      setIsSyncing(false);
    };

    loadData();
  }, [currentUser]);

  // Global Sync Logic
  useEffect(() => {
    if (!currentUser) return;

    const syncTimer = setTimeout(async () => {
      localStorage.setItem(`daily-transactions-customers-${currentUser}`, JSON.stringify(customers));
      localStorage.setItem(`daily-transactions-items-${currentUser}`, JSON.stringify(items));

      if (isVercelEnabled()) {
        setIsSyncing(true);
        try {
          await Promise.all([
            cloudSave(currentUser, 'customers', customers),
            cloudSave(currentUser, 'items', items)
          ]);
        } catch (e) {
          console.error("Cloud sync failed", e);
        } finally {
          setIsSyncing(false);
        }
      }
    }, 1500);

    return () => clearTimeout(syncTimer);
  }, [customers, items, currentUser]);

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    window.sessionStorage.setItem('daily-transactions-user', username);
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    window.sessionStorage.removeItem('daily-transactions-user');
    setCustomers([]);
    setItems([]);
    setSelectedCustomerId(null);
    setActiveView('customers');
  };

  const handleAddCustomer = (name: string, phone: string) => {
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      name,
      phone,
      transactions: [],
    };
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
      date: new Date().toISOString(),
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

  const renderContent = () => {
    if (selectedCustomer) {
      return (
        <CustomerDetail 
          customer={selectedCustomer} 
          onAddTransaction={handleAddTransaction}
          onEditTransaction={handleEditTransaction}
          allItems={items} 
          onAddItem={handleAddItem}
        />
      );
    }
    
    switch(activeView) {
      case 'customers':
        return <CustomerList customers={customers} onSelectCustomer={setSelectedCustomerId} onAddCustomer={handleAddCustomer} />;
      case 'items':
        return <ItemsList items={items} onAddItem={handleAddItem} onEditItem={handleEditItem} onDeleteItem={handleDeleteItem} onAddMultipleItems={handleAddMultipleItems} />;
      case 'settings':
        return <SettingsPage 
          onExport={() => {}} 
          onImport={() => {}} 
          onLogout={handleLogout} 
          currentUser={currentUser} 
          onInstallClick={() => {}}
          isInstallable={false}
          isInstalled={false}
          isSyncing={isSyncing}
        />;
      default:
        return <CustomerList customers={customers} onSelectCustomer={setSelectedCustomerId} onAddCustomer={handleAddCustomer} />;
    }
  };

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
          <div className="flex justify-between items-center mb-4 px-1">
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${cloudReady ? 'bg-success shadow-[0_0_8px_rgba(22,163,74,0.6)]' : 'bg-slate-300'}`}></div>
               <span className={`text-[10px] font-black uppercase tracking-widest ${
                 cloudReady ? 'text-success' : 'text-slate-500'
               }`}>
                 {cloudReady ? 'Cloud Synchronized' : 'Local Storage Only'}
               </span>
            </div>
            {isSyncing && (
              <span className="text-[10px] font-black text-primary flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-full">
                <div className="w-1 h-1 bg-primary rounded-full animate-ping"></div>
                UPDATING CLOUD...
              </span>
            )}
          </div>
          {renderContent()}
        </main>
        
        <UpdateNotification show={showUpdate} onUpdate={() => window.location.reload()} />
        {!selectedCustomer && <BottomNav activeView={activeView} setActiveView={setActiveView} />}
      </div>
    </div>
  );
};

export default App;
