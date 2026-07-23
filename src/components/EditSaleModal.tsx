import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Sale, SaleItem } from '../stores/posStore';
import { useInventoryStore } from '../stores/inventoryStore';

interface EditSaleModalProps {
  sale: Sale | null;
  onClose: () => void;
  onSave: (updates: Partial<Sale>, items: SaleItem[]) => Promise<void>;
}

const EditSaleModal: React.FC<EditSaleModalProps> = ({ sale, onClose, onSave }) => {
  const { products } = useInventoryStore();
  const [items, setItems] = useState<SaleItem[]>(sale?.items || []);
  const [discount, setDiscount] = useState(sale?.discount || 0);
  const [tax, setTax] = useState(sale?.tax || 0);
  const [amountPaid, setAmountPaid] = useState(sale?.amountPaid || 0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>(sale?.paymentMethod || 'cash');
  const [saving, setSaving] = useState(false);

  // for dropdown search
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [searchTerms, setSearchTerms] = useState<{ [key: number]: string }>({});

  // Recalculate totals whenever items, discount, or tax change
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal + tax - discount;
  
  // Recalculate Change and Due Amount based on the new total and amountPaid
  let change: number;
  let dueAmount: number;

  if (paymentMethod === 'credit') {
      // In 'Credit' sales, the total is the due amount if amountPaid is not specified (or 0)
      // Since amountPaid can now be edited, we calculate due and change based on it
      change = Math.max(0, amountPaid - total);
      dueAmount = Math.max(0, total - amountPaid);
  } else {
      // For Cash/Card, standard POS change/due calculation applies
      change = Math.max(0, amountPaid - total);
      dueAmount = Math.max(0, total - amountPaid);
  }


  // --- Event Handlers ---

  const handleAddItem = () => {
    if (products.length === 0) return;
    const firstProduct = products[0];
    setItems([
      ...items,
      {
        product: firstProduct,
        quantity: 1,
        subtotal: firstProduct.price,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'product' | 'quantity', value: any) => {
    setItems(
      items.map((item, i) => {
        if (i !== index) return item;

        if (field === 'product') {
          const productId = typeof value === 'string' ? parseInt(value, 10) : value;
          const product = products.find((p) => p.id === productId);
          if (!product) return item;
          return {
            ...item,
            product,
            subtotal: product.price * item.quantity,
          };
        } else {
          const quantity = parseInt(value, 10) || 0;
          return {
            ...item,
            quantity,
            subtotal: item.product.price * quantity,
          };
        }
      })
    );
  };
  
  // NOTE: If payment method changes to 'credit', reset amountPaid to a sane value like current paid or 0
  useEffect(() => {
    if (paymentMethod === 'credit' && amountPaid === 0 && (sale?.amountPaid || 0) > 0) {
        // If it was originally a paid sale, keep the paid amount as the default for editing.
        setAmountPaid(sale?.amountPaid || 0);
    }
  }, [paymentMethod, sale?.amountPaid]);

  if (!sale) return null;


  const handleSave = async () => {
    if (items.length === 0) {
      alert('Sale must have at least one item');
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<Sale> = {
        total: subtotal,
        tax,
        discount,
        finalAmount: total,
        amountPaid, // <-- This is the key field that gets the new value
        change,
        dueAmount,
        paymentMethod,
      };

      await onSave(updates, items);
      onClose();
    } catch (error) {
      alert('Failed to update sale');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Sale #{sale.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Items</h3>
              <button
                onClick={handleAddItem}
                className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const filteredProducts = products.filter((p) =>
                  p.name.toLowerCase().includes((searchTerms[index] || '').toLowerCase())
                );

                return (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2 relative"
                  >
                    <div className="flex items-center space-x-3">
                      {/* custom searchable dropdown */}
                      <div className="relative w-full">
                        <div
                          onClick={() =>
                            setOpenDropdown(openDropdown === index ? null : index)
                          }
                          className="flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 cursor-pointer text-gray-900 dark:text-white"
                        >
                          <span>
                            {item.product?.name
                              ? `${item.product.name} - Rs. ${item.product.price}`
                              : 'Select product'}
                          </span>
                          <ChevronDown className="w-4 h-4 opacity-70" />
                        </div>

                        {/* Dropdown menu */}
                        {openDropdown === index && (
                          <div className="absolute mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto">
                            <input
                              type="text"
                              placeholder="Search..."
                              autoFocus
                              value={searchTerms[index] || ''}
                              onChange={(e) =>
                                setSearchTerms({
                                  ...searchTerms,
                                  [index]: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                            />
                            {filteredProducts.length > 0 ? (
                              filteredProducts.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    handleItemChange(index, 'product', p.id);
                                    setOpenDropdown(null);
                                  }}
                                  className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white"
                                >
                                  {p.name} - Rs. {p.price}
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                No products found
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', e.target.value)
                        }
                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />

                      <div className="w-32 text-right font-medium text-gray-900 dark:text-white">
                        Rs. {item.subtotal.toFixed(2)}
                      </div>

                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sale Info Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Discount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tax
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as 'cash' | 'card' | 'credit')
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            {/* THE AMOUNT PAID FIELD IS NOW ALWAYS VISIBLE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount Paid
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium text-gray-900 dark:text-white">Rs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tax:</span>
              <span className="font-medium text-gray-900 dark:text-white">Rs. {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Discount:</span>
              <span className="font-medium text-gray-900 dark:text-white">Rs. {discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 dark:border-gray-600 pt-2">
              <span className="text-gray-900 dark:text-white">Total:</span>
              <span className="text-gray-900 dark:text-white">Rs. {total.toFixed(2)}</span>
            </div>
            {/* Display Amount Paid, Change, and Due Amount regardless of payment method */}
            <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                  <span className="font-medium text-gray-900 dark:text-white">Rs. {amountPaid.toFixed(2)}</span>
                </div>
                {change > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Change:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">Rs. {change.toFixed(2)}</span>
                  </div>
                )}
            </>
            {dueAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Due Amount:</span>
                <span className="font-medium text-red-600 dark:text-red-400">Rs. {dueAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSaleModal;