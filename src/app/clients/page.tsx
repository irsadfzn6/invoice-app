"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useInvoiceStore } from "@/store/invoiceStore";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
} from "lucide-react";
import Link from "next/link";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { clients, deleteClient, invoices } = useInvoiceStore();

  const filteredClients = clients
    .filter((client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getClientInvoiceCount = (clientId: string) => {
    return invoices.filter((inv) => inv.client_id === clientId).length;
  };

  const getClientTotalAmount = (clientId: string) => {
    return invoices
      .filter((inv) => inv.client_id === clientId && inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total, 0);
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin ingin menghapus client ini? Semua invoice terkait juga akan terhapus.")) {
      deleteClient(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 min-h-screen transition-all duration-300" style={{ marginLeft: "16rem" }}>
        <div className="p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Client</h1>
              <p className="mt-1 text-gray-500">Kelola data client Anda</p>
            </div>
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Tambah Client
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nama</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Telepon</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Alamat</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Jumlah Invoice</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total Transaksi</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        {clients.length === 0 ? (
                          <>
                            <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-lg font-medium">Belum ada client</p>
                            <p className="text-sm mt-1">Tambah client pertama Anda</p>
                          </>
                        ) : (
                          "Tidak ada client yang cocok dengan pencarian"
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{client.name}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            {client.email}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {client.phone ? (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              {client.phone}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">
                          {client.address ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-gray-400" />
                              {client.address}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm font-medium text-gray-900">
                          {getClientInvoiceCount(client.id)}
                        </td>
                        <td className="py-4 px-4 text-sm font-medium text-gray-900">
                          Rp {getClientTotalAmount(client.id).toLocaleString("id-ID")}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/clients/${client.id}/edit`}
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(client.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}