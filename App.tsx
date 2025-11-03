import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Customer, Transaction, TransactionType, Item, TransactionItem } from './types';
import CustomerList from './components/CustomerList';
import CustomerDetail from './components/CustomerDetail';
import Header from './components/Header';
import AddCustomerModal from './components/AddCustomerModal';
import ItemsList from './components/ItemsList';
import BottomNav from './components/BottomNav';
import InstallBanner from './components/InstallBanner';
import SettingsPage from './components/SettingsPage';
import AuthPage from './components/AuthPage';

type View = 'customers' | 'items' | 'settings';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return window.sessionStorage.getItem('daily-transactions-user');
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('customers');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // Load data when user logs in
  useEffect(() => {
    if (!currentUser) return;
    try {
      const customersKey = `daily-transactions-customers-${currentUser}`;
      const itemsKey = `daily-transactions-items-${currentUser}`;
      
      const storedCustomers = window.localStorage.getItem(customersKey);
      setCustomers(storedCustomers ? JSON.parse(storedCustomers) : []);
      
      const storedItems = window.localStorage.getItem(itemsKey);
      setItems(storedItems ? JSON.parse(storedItems) : []);
    } catch (error) {
      console.error('Error reading data from localStorage', error);
      setCustomers([]);
      setItems([]);
    }
  }, [currentUser]);

  // Save customers data when it changes
  useEffect(() => {
    if (!currentUser) return;
    try {
      const key = `daily-transactions-customers-${currentUser}`;
      window.localStorage.setItem(key, JSON.stringify(customers));
    } catch (error) {
      console.error('Error writing customers to localStorage', error);
    }
  }, [customers, currentUser]);

  // Save items data when it changes
  useEffect(() => {
    if (!currentUser) return;
    try {
      const key = `daily-transactions-items-${currentUser}`;
      window.localStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
      console.error('Error writing items to localStorage', error);
    }
  }, [items, currentUser]);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    setIsInstalled(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mediaQuery.addEventListener('change', listener);
    
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isBannerDismissed = localStorage.getItem('daily-transactions-install-banner-dismissed');
      if (!isBannerDismissed && !isInstalled) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setShowInstallBanner(false);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('daily-transactions-install-banner-dismissed', 'true');
  };
  
  const handleLogin = (username: string) => {
    setCurrentUser(username);
    window.sessionStorage.setItem('daily-transactions-user', username);
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    window.sessionStorage.removeItem('daily-transactions-user');
    // Clear state to prevent data flashing for next user
    setCustomers([]);
    setItems([]);
    setSelectedCustomerId(null);
    setActiveView('customers');
  };


  const handleAddCustomer = (name: string, phone: string) => {
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name,
      phone,
      transactions: [],
    };
    setCustomers(prevCustomers => [...prevCustomers, newCustomer]);
  };

  const handleAddItem = (name: string, price: number, unit: string): Item => {
    const newItem: Item = {
      id: Date.now().toString(),
      name,
      price,
      unit,
    };
    setItems(prevItems => [...prevItems, newItem]);
    return newItem;
  };

  const handleEditItem = (updatedItem: Item) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const handleAddMultipleItems = (itemsToAdd: Array<Omit<Item, 'id'>>) => {
    const newItems: Item[] = itemsToAdd.map((item, index) => ({
      ...item,
      id: `${Date.now()}-${index}`,
    }));
    setItems(prevItems => [...prevItems, ...newItems]);
  };

  const handleAddTransaction = (customerId: string, transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    setCustomers(prevCustomers =>
      prevCustomers.map(c =>
        c.id === customerId
          ? { ...c, transactions: [newTransaction, ...c.transactions] }
          : c
      )
    );
  };
  
  const handleExportData = () => {
    const data = {
      customers,
      items,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `daily-transactions-backup-${currentUser}.json`;
    link.click();
  };
  
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = e => {
        if (e.target?.result) {
          const result = e.target.result;
          const confirmed = window.confirm("Are you sure you want to import this file? This will overwrite all current data for this user.");
          if (confirmed) {
            try {
              const data = JSON.parse(result as string);
              if (data.customers && data.items) {
                setCustomers(data.customers);
                setItems(data.items);
                alert("Data imported successfully!");
                setActiveView('customers'); // Switch back to a main view
              } else {
                alert("Invalid data file format.");
              }
            } catch (error) {
              console.error("Error parsing JSON!", error);
              alert("Error importing file. Make sure it's a valid backup file.");
            }
          }
        }
      };
    }
    // Reset file input to allow importing the same file again
    event.target.value = '';
  };


  const handleBack = () => {
    setSelectedCustomerId(null);
  };

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);
  
  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (selectedCustomer) {
      return (
        <CustomerDetail 
          customer={selectedCustomer} 
          onAddTransaction={handleAddTransaction}
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
          onExport={handleExportData} 
          onImport={handleImportData} 
          onLogout={handleLogout} 
          currentUser={currentUser} 
          onInstallClick={handleInstallClick}
          isInstallable={!!deferredPrompt}
          isInstalled={isInstalled}
        />;
      default:
        return <CustomerList customers={customers} onSelectCustomer={setSelectedCustomerId} onAddCustomer={handleAddCustomer} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="container mx-auto max-w-2xl bg-white min-h-screen shadow-lg relative">
        <Header 
          customerName={selectedCustomer?.name} 
          onBack={selectedCustomer ? handleBack : undefined}
          activeView={activeView}
          showInstallButton={!!deferredPrompt && !selectedCustomer && !isInstalled}
          onInstallClick={handleInstallClick}
        />
        <main className="p-4 pb-24">
          {renderContent()}
        </main>
        
        {showInstallBanner && !selectedCustomer && activeView !== 'settings' && !isInstalled && (
          <InstallBanner
            onInstall={handleInstallClick}
            onDismiss={handleDismissInstallBanner}
          />
        )}

        {!selectedCustomer && <BottomNav activeView={activeView} setActiveView={setActiveView} />}
      </div>
    </div>
  );
};

export default App;