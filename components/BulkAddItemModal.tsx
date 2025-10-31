import React, { useState, useMemo, useEffect } from 'react';
import { Item } from '../types';

interface BulkAddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMultipleItems: (items: Array<Omit<Item, 'id'>>) => void;
}

type ParsedItem = {
  originalLine: string;
  item: Omit<Item, 'id'> | null;
  isValid: boolean;
  error?: string;
};

const BulkAddItemModal: React.FC<BulkAddItemModalProps> = ({ isOpen, onClose, onAddMultipleItems }) => {
  const [rawText, setRawText] = useState('');

  const parsedItems: ParsedItem[] = useMemo(() => {
    if (!rawText.trim()) {
      return [];
    }
    const lines = rawText.split('\n');
    return lines.map(line => {
      if (!line.trim()) {
        return { originalLine: line, item: null, isValid: true, error: 'Empty line, will be ignored.' }; // Technically valid to ignore
      }
      const parts = line.split(',').map(p => p.trim());
      const name = parts[0];
      const priceStr = parts[1];
      const unit = parts[2] || '';

      if (!name) {
        return { originalLine: line, item: null, isValid: false, error: 'Item name is missing.' };
      }
      if (priceStr === undefined) {
        return { originalLine: line, item: null, isValid: false, error: 'Price is missing.' };
      }
      const price = parseFloat(priceStr);
      if (isNaN(price) || price < 0) {
        return { originalLine: line, item: null, isValid: false, error: 'Invalid price. Must be a non-negative number.' };
      }

      return {
        originalLine: line,
        item: { name, price, unit },
        isValid: true,
      };
    });
  }, [rawText]);
  
  const validItems = useMemo(() => {
      return parsedItems.filter(p => p.isValid && p.item).map(p => p.item!);
  }, [parsedItems]);

  useEffect(() => {
    if (!isOpen) {
      setRawText('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (validItems.length > 0) {
      onAddMultipleItems(validItems);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4 flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-2 text-slate-800">Add Multiple Items</h2>
        <p className="text-sm text-slate-500 mb-4">
          Enter each item on a new line. Format: <code className="bg-slate-100 p-1 rounded">Name, Price, Unit (optional)</code>.
          <br/>
          Example: <code className="bg-slate-100 p-1 rounded">Milk, 1.50, litre</code>
        </p>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="w-full h-40 p-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary resize-y mb-4"
          placeholder={"Banana, 0.50, piece\nBread, 2.20\nCoffee, 5.00, kg"}
          aria-label="Input for multiple items"
        />

        <h3 className="text-lg font-semibold mb-2 text-slate-700">Preview</h3>
        <div className="flex-grow border border-slate-200 rounded-md overflow-y-auto p-2 bg-slate-50">
          {parsedItems.length > 0 ? (
            <ul className="space-y-2">
              {parsedItems.map((p, index) => {
                if (!p.item && p.isValid) return null; // Ignore empty lines
                return (
                  <li key={index} className={`p-2 rounded-md ${p.isValid ? 'bg-white' : 'bg-red-100'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-800">{p.item?.name || 'Invalid Item'}</span>
                      {p.item && <span className="text-slate-600">{p.item.price.toFixed(2)}€ {p.item.unit ? `/ ${p.item.unit}`: ''}</span>}
                    </div>
                    {!p.isValid && <p className="text-xs text-danger mt-1">{p.error}</p>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-slate-400">Preview will appear here</p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 mt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={validItems.length === 0}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-slate-400"
          >
            Add {validItems.length} Item{validItems.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkAddItemModal;
