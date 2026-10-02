"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
  FileText,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useSupabaseStore } from "@/store/supabaseStore";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const statCards = [
  {
    name: "Total Invoice",
    value: 0,
    icon: FileText,
    color: "bg-blue-500",
    change: "+12%",
    trend: "up" as const,
  },
  {
    name: "Total Client",
    value: 0,
    icon: Users,
    color: "bg-green-500",
    change: "+5%",
    trend: "up" as const,
  },
  {
    name: "Pendapatan Bulan Ini",
    value: 0,
    icon: DollarSign,
    color: "bg-purple-500",
    change: "+23%",
    trend: "up" as const,
  },
  {
    name: "Belum Lunas",
    value: 0,
    icon: Clock,
    color: "bg-orange-500",
    change: "-3%",
    trend: "down" as const,
  },
];

function StatCard({
  name,
  value,
  icon: Icon,
  color,
  change,
  trend,
}: {
  name: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  change: string;
  trend: "up" | "down";
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{name}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1">
        <span
          className={`text-sm font-medium ${
            trend === "up" ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
        </span>
        <span className="text-sm text-gray-500">{change} dari bulan lalu</span>
      </div>
    </div>
  );
}

function RecentInvoices() {
  const { invoices } = useSupabaseStore();
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

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

  if (recentInvoices.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Terbaru</h3>
        <p className="text-gray-500 text-center py-8">Belum ada invoice. Buat invoice pertama Anda!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Invoice Terbaru</h3>
        <a href="/invoices" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Lihat semua →
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nomor</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tanggal</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                  {invoice.invoice_number}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {invoice.client?.name || "Unknown"}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {format(new Date(invoice.issue_date), "dd MMM yyyy", { locale: id })}
                </td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                  Rp {invoice.total.toLocaleString("id-ID")}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[invoice.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statusLabels[invoice.status] || invoice.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { invoices, clients } = useSupabaseStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = mounted
    ? [
        {
          ...statCards[0],
          value: invoices.length,
        },
        {
          ...statCards[1],
          value: clients.length,
        },
        {
          ...statCards[2],
          value: `Rp ${invoices
            .filter((inv) => inv.status === "paid")
            .reduce((sum, inv) => sum + inv.total, 0)
            .toLocaleString("id-ID")}`,
        },
        {
          ...statCards[3],
          value: invoices.filter((inv) => inv.status !== "paid" && inv.status !== "cancelled").length,
        },
      ]
    : statCards;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 min-h-screen transition-all duration-300" style={{ marginLeft: "16rem" }}>
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-gray-500">Selamat datang di Invoice App</p>
          </div>

          <div className="grid gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <RecentInvoices />
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Cepat</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-900">Invoice Draft</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {invoices.filter((inv) => inv.status === "draft").length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-900">Total Piutang</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    Rp {invoices
                      .filter((inv) => inv.status === "sent" || inv.status === "overdue")
                      .reduce((sum, inv) => sum + inv.total, 0)
                      .toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-900">Client Aktif</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {clients.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}