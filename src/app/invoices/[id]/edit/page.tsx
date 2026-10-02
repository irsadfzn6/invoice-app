"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useInvoiceStore } from "@/store/invoiceStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, X, Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useParams } from "next/navigation";

const invoiceSchema = z.object({
  client_id: z.string().min(1, "Pilih client"),
  issue_date: z.string().min(1, "Tanggal terbit wajib diisi"),
  due_date: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
  items: z.array(
    z.object({
      description: z.string().min(1, "Deskripsi wajib diisi"),
      quantity: z.number().min(1, "Minimal 1"),
      unit_price: z.number().min(0, "Harga tidak boleh negatif"),
    })
  ).min(1, "Minimal 1 item"),
  notes: z.string().optional(),
  tax: z.number().min(0),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

const calculateItemTotal = (quantity: number, unitPrice: number) => quantity * unitPrice;
const calculateSubtotal = (items: { quantity: number; unit_price: number }[]) =>
  items.reduce((sum, item) => sum + calculateItemTotal(item.quantity, item.unit_price), 0);
const calculateTax = (subtotal: number, taxRate: number) => (subtotal * taxRate) / 100;
const calculateTotal = (subtotal: number, tax: number) => subtotal + tax;

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { clients, invoices, updateInvoice } = useInvoiceStore();
  const [items, setItems] = useState<InvoiceFormData["items"]>([]);
  const [saved, setSaved] = useState(false);

  const invoice = invoices.find((inv) => inv.id === params.id);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      issue_date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      tax: 11,
      status: "draft",
    },
  });

  useEffect(() => {
    if (invoice) {
      setItems(
        invoice.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }))
      );
      setValue("client_id", invoice.client_id);
      setValue("issue_date", invoice.issue_date);
      setValue("due_date", invoice.due_date);
      setValue("notes", invoice.notes || "");
      setValue("tax", invoice.tax);
      setValue("status", invoice.status);
    }
  }, [invoice, setValue]);

  const watchedItems = watch("items") || [];
  const subtotal = calculateSubtotal(watchedItems);
  const tax = calculateTax(subtotal, (watch("tax") as number) || 11);
  const total = calculateTotal(subtotal, tax);

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    setValue("items", newItems, { shouldValidate: true });
  };

  const onSubmit = async (data: InvoiceFormData) => {
    updateInvoice(invoice!.id, {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        total: item.quantity * item.unit_price,
      })),
      subtotal,
      tax,
      total,
    });
    setSaved(true);
    setTimeout(() => {
      router.push(`/invoices/${invoice!.id}`);
    }, 1000);
  };

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 min-h-screen transition-all duration-300" style={{ marginLeft: "16rem" }}>
        <div className="p-6 lg:p-8 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <Link
              href={`/invoices/${invoice.id}`}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
              Kembali
            </Link>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Edit Invoice</h1>
          </div>

          {saved && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <Save className="h-5 w-5" />
              <span>Invoice berhasil diperbarui! Mengalihkan...</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid gap-6 mb-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client <span className="text-red-500">*</span></label>
                <select
                  {...register("client_id")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
                {errors.client_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Invoice</label>
                <input
                  type="text"
                  value={invoice.invoice_number}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Terbit <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  {...register("issue_date")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.issue_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.issue_date.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  {...register("due_date")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.due_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Item Invoice</h2>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-500 w-64">Deskripsi</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-500 w-24">Qty</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-500 w-40">Harga Satuan</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-500 w-40">Total</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-500 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((_, index) => (
                      <tr key={index}>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={items[index].description}
                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
                            placeholder="Deskripsi item"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={items[index].quantity}
                            onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                            min={1}
                            className="w-full px-3 py-2 text-right border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={items[index].unit_price}
                            onChange={(e) => handleItemChange(index, "unit_price", Number(e.target.value))}
                            min={0}
                            step={100}
                            className="w-full px-3 py-2 text-right border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-gray-900">
                          Rp {calculateItemTotal(items[index].quantity, items[index].unit_price).toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length <= 1}
                            className="text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <textarea
                {...register("notes")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Catatan tambahan untuk client..."
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pajak (%)</label>
                <input
                  type="number"
                  {...register("tax", { valueAsNumber: true })}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  {...register("status")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Terkirim</option>
                  <option value="paid">Lunas</option>
                  <option value="overdue">Jatuh Tempo</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Pajak ({watch("tax") || 11}%)</span>
                <span className="font-medium">Rp {tax.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Total</span>
                <span>Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Link
                href={`/invoices/${invoice.id}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 mr-1" />
                Batal
              </Link>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}