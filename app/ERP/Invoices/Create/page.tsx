"use client"; // ✨ required to use hooks & next/navigation in app router

import { useState, useEffect } from "react";
import { FiCalendar, FiPlus, FiX, FiDollarSign, FiUser, FiTrash2 } from "react-icons/fi";
import { useRouter } from "next/navigation";

// Type definitions
type Customer = {
  id: string;
  name: string;
  taxNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type InvoiceItem = {
  description: string;
  amount: number;
  category: string;
};

type InvoiceFormData = {
  customerId: string;
  amount: string;
  currencyId: string;
  transactionDate: string;
  description: string;
  isTaxable: boolean;
  items: InvoiceItem[];
};

const formatCurrency = (amount: number, currencyCode: string = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};

const CreateInvoice = () => {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerId: "",
    amount: "",
    currencyId: "",
    transactionDate: new Date().toISOString().split("T")[0],
    description: "",
    isTaxable: true,
    items: [
      {
        description: "",
        amount: 0,
        category: "",
      },
    ],
  });

  // Fetch customers and currencies
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const token = sessionStorage.getItem("token");

      try {
        // Customers
        const customersResponse = await fetch(
          "https://nvccz-pi.vercel.app/api/accounting/customers",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!customersResponse.ok) throw new Error("Failed to fetch customers");
        const customersData = await customersResponse.json();
        if (
          customersData.success &&
          customersData.data &&
          Array.isArray(customersData.data.customers)
        ) {
          setCustomers(customersData.data.customers);
        }

        // Currencies
        const currenciesRes = await fetch(
          "https://nvccz-pi.vercel.app/api/accounting/currencies",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (currenciesRes.ok) {
          const currenciesData = await currenciesRes.json();
          const activeCurrencies = currenciesData.data.filter(
            (c: Currency) => c.isActive
          );
          setCurrencies(activeCurrencies || []);
          const defaultCurrency = activeCurrencies.find(
            (c: Currency) => c.isDefault
          );
          if (defaultCurrency) {
            setFormData((prev) => ({
              ...prev,
              currencyId: defaultCurrency.id,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Special "create client" option
    if (name === "customerId" && value === "__create__") {
      router.push("/ERP/Tools/Clients");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === "amount" ? Number(value) : value,
    };
    setFormData((prev) => ({
      ...prev,
      items: newItems,
      amount: newItems
        .reduce((sum, item) => sum + (item.amount || 0), 0)
        .toString(),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", amount: 0, category: "" }],
    }));
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      items: newItems,
      amount: newItems
        .reduce((sum, item) => sum + (item.amount || 0), 0)
        .toString(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const token = sessionStorage.getItem("token");

    try {
      const response = await fetch(
        "https://nvccz-pi.vercel.app/api/accounting/invoices",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            amount: parseFloat(formData.amount),
            items: formData.items.map((item) => ({
              ...item,
              amount: Number(item.amount),
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      if (data.success) {
        setFormData({
          customerId: "",
          amount: "",
          currencyId: currencies.find((c) => c.isDefault)?.id || "",
          transactionDate: new Date().toISOString().split("T")[0],
          description: "",
          isTaxable: true,
          items: [{ description: "", amount: 0, category: "" }],
        });
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencyCode = formData.currencyId
    ? currencies.find((c) => c.id === formData.currencyId)?.code || "USD"
    : "USD";
  const subtotal = parseFloat(formData.amount || "0") || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">New Invoice</h1>
          <p className="text-gray-500 mt-1">
            Create and send professional invoices to your clients
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
          >
            <FiX className="mr-2" /> Clear
          </button>
          <button
            type="submit"
            form="invoice-form"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition-colors shadow-md flex items-center"
            disabled={isLoading}
          >
            {isSubmitting ? "Saving..." : "Save Invoice"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <form
          id="invoice-form"
          onSubmit={handleSubmit}
          className="divide-y divide-gray-100"
        >
          {/* Client & Basic Info Section */}
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Client & Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Dropdown */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    disabled={isLoading}
                  >
                    <option value="">
                      {isLoading ? "Loading clients..." : "Select a client"}
                    </option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                    <option value="__create__">+ Create a client…</option>
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="transactionDate"
                    value={formData.transactionDate}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="currencyId"
                    value={formData.currencyId}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    disabled={isLoading}
                  >
                    <option value="">
                      {isLoading ? "Loading currencies..." : "Select currency"}
                    </option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tax Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apply Tax
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isTaxable}
                  onClick={() =>
                    setFormData((p) => ({ ...p, isTaxable: !p.isTaxable }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    formData.isTaxable ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                      formData.isTaxable ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes or terms"
                />
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FiPlus className="mr-2" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 items-end p-4 bg-gray-50 rounded-lg"
                >
                  <div className="col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      required
                      className="block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Service or product"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={item.category}
                      onChange={(e) =>
                        handleItemChange(index, "category", e.target.value)
                      }
                      className="block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Consulting"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiDollarSign className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        value={item.amount || ""}
                        onChange={(e) =>
                          handleItemChange(index, "amount", e.target.value)
                        }
                        required
                        min="0"
                        step="0.01"
                        className="block w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                      disabled={formData.items.length <= 1}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="p-6 bg-gray-50">
            <div className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span className="text-blue-600">
                  {formatCurrency(subtotal, currencyCode)}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Tax will be applied automatically if enabled.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoice;
