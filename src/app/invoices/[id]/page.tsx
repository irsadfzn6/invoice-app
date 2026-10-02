"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useInvoiceStore } from "@/store/invoiceStore";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Download,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Terkirim",
  paid: "Lunas",
  overdue: "Jatuh Tempo",
  cancelled: "Dibatalkan",
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  draft: FileText,
  sent: Clock,
  paid: CheckCircle,
  overdue: AlertCircle,
  cancelled: XCircle,
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { invoices, clients, updateInvoice, deleteInvoice } = useInvoiceStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const invoice = invoices.find((inv) => inv.id === params.id);
  const client = invoice ? clients.find((c) => c.id === invoice.client_id) : null;

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Invoice tidak ditemukan</h1>
          <Link
            href="/invoices"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Invoice
          </Link>
        </div>
      </div>
    );
  }

  const isOverdue = invoice.status !== "paid" && invoice.status !== "cancelled" && new Date(invoice.due_date) < new Date();
  const displayStatus = isOverdue && invoice.status !== "paid" && invoice.status !== "cancelled" ? "overdue" : invoice.status;

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(30, 64, 175); // Blue-600
    doc.text("INVOICE", pageWidth - 20, 25, { align: "right" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(invoice.invoice_number, pageWidth - 20, 32, { align: "right" });
    
    // Company info (left)
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.setFont("helvetica", "bold");
    doc.text("Invoice App", 20, 25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    
    // From/To
    let yPos = 50;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text("DARI:", 20, yPos);
    doc.text("KEPADA:", pageWidth / 2 + 10, yPos);
    
    yPos += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81); // Gray-700
    
    const fromLines = ["Invoice App", "Indonesia"].filter(Boolean);
    const toLines = [
      client?.name || "Unknown",
      client?.email || "",
      client?.phone || "",
      client?.address || "",
    ].filter(Boolean);
    
    fromLines.forEach((line) => {
      doc.text(line, 20, yPos);
      yPos += 5;
    });
    
    yPos = 57;
    toLines.forEach((line) => {
      doc.text(line, pageWidth / 2 + 10, yPos);
      yPos += 5;
    });
    
    // Invoice details
    yPos = Math.max(yPos, 85) + 10;
    doc.setDrawColor(229, 231, 235); // Gray-200
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;
    
    const details = [
      ["Tanggal Terbit", format(new Date(invoice.issue_date), "dd MMMM yyyy", { locale: id })],
      ["Jatuh Tempo", format(new Date(invoice.due_date), "dd MMMM yyyy", { locale: id })],
      ["Status", statusLabels[displayStatus] || displayStatus],
    ];
    
    details.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(label, 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(17, 24, 39);
      doc.text(value, 80, yPos);
      yPos += 6;
    });
    
    // Items table
    yPos += 5;
    const tableData = invoice.items.map((item, index) => [
      String(index + 1),
      item.description,
      String(item.quantity),
      `Rp ${item.unit_price.toLocaleString("id-ID")}`,
      `Rp ${item.total.toLocaleString("id-ID")}`,
    ]);
    
    (doc as any).autoTable({
      startY: yPos,
      head: [["No", "Deskripsi", "Qty", "Harga Satuan", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        2: { cellWidth: 15, halign: "center" },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: 35, halign: "right" },
      },
    });
    
    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const rightX = pageWidth - 20;
    
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", rightX - 60, finalY, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`Rp ${invoice.subtotal.toLocaleString("id-ID")}`, rightX, finalY, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.text(`Pajak (${invoice.tax}%):`, rightX - 60, finalY + 7, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`Rp ${invoice.tax.toLocaleString("id-ID")}`, rightX, finalY + 7, { align: "right" });
    
    doc.setDrawColor(229, 231, 235);
    doc.line(rightX - 65, finalY + 10, rightX, finalY + 10);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text("TOTAL:", rightX - 60, finalY + 17, { align: "right" });
    doc.text(`Rp ${invoice.total.toLocaleString("id-ID")}`, rightX, finalY + 17, { align: "right" });
    
    // Notes
    if (invoice.notes) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("Catatan:", 20, finalY + 30);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(55, 65, 81);
      const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 40);
      doc.text(splitNotes, 20, finalY + 37);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // Gray-400
    doc.text("Dibuat dengan Invoice App", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    
    doc.save(`${invoice.invoice_number}.pdf`);
  };

  const handleDelete = () => {
    deleteInvoice(invoice.id);
    router.push("/invoices");
  };

  const handleStatusChange = (newStatus: typeof invoice.status) => {
    updateInvoice(invoice.id, { status: newStatus });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 min-h-screen transition-all duration-300" style={{ marginLeft: "16rem" }}>
        <div className="p-6 lg:p-8 max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/invoices"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
              Kembali
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={generatePDF}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                PDF
              </button>
              <Link
                href={`/invoices/${invoice.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoice_number}</h1>
                    <p className="mt-1 text-gray-500">Dibuat pada {format(new Date(invoice.created_at), "dd MMMM yyyy HH:mm", { locale: id })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        statusColors[displayStatus] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {(() => {
                        const Icon = statusIcons[displayStatus] || FileText;
                        return <Icon className="h-3.5 w-3.5 mr-1.5" />;
                      })()}
                      {statusLabels[displayStatus] || displayStatus}
                    </span>
                    {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                      <select
                        value={invoice.status}
                        onChange={(e) => handleStatusChange(e.target.value as typeof invoice.status)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Terkirim</option>
                        <option value="paid">Lunas</option>
                        <option value="cancelled">Dibatalkan</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Deskripsi</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 w-20">Qty</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 w-36">Harga Satuan</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 w-36">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoice.items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{item.description}</div>
                          </td>
                          <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            Rp {item.unit_price.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-gray-900">
                            Rp {item.total.toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-end space-x-8">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">Rp {invoice.subtotal.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pajak ({invoice.tax}%)</span>
                        <span className="font-medium">Rp {invoice.tax.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                        <span>Total</span>
                        <span>Rp {invoice.total.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {invoice.notes && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Catatan</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  Informasi Client
                </h3>
                {client ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Nama</p>
                      <p className="font-medium text-gray-900">{client.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900 flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        {client.email}
                      </p>
                    </div>
                    {client.phone && (
                      <div>
                        <p className="text-sm text-gray-500">Telepon</p>
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {client.phone}
                        </p>
                      </div>
                    )}
                    {client.address && (
                      <div>
                        <p className="text-sm text-gray-500">Alamat</p>
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {client.address}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Client tidak ditemukan</p>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  Detail Invoice
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nomor Invoice</p>
                    <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Terbit</p>
                    <p className="font-medium text-gray-900">{format(new Date(invoice.issue_date), "dd MMMM yyyy", { locale: id })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Jatuh Tempo</p>
                    <p className={`font-medium ${isOverdue && invoice.status !== "paid" && invoice.status !== "cancelled" ? "text-red-600" : "text-gray-900"}`}>
                      {format(new Date(invoice.due_date), "dd MMMM yyyy", { locale: id })}
                      {isOverdue && invoice.status !== "paid" && invoice.status !== "cancelled" && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Lewat
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[displayStatus] || "bg-gray-100 text-gray-800"}`}>
                      {(() => {
                        const Icon = statusIcons[displayStatus] || FileText;
                        return <Icon className="h-3 w-3 mr-1.5" />;
                      })()}
                      {statusLabels[displayStatus] || displayStatus}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Jumlah Item</p>
                    <p className="font-medium text-gray-900">{invoice.items.length} item</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  Ringkasan Keuangan
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">Rp {invoice.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pajak ({invoice.tax}%)</span>
                    <span className="font-medium">Rp {invoice.tax.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span>Rp {invoice.total.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Hapus Invoice
                </button>
              </div>
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Invoice?</h3>
                <p className="text-gray-600 mb-6">
                  Invoice <strong>{invoice.invoice_number}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}