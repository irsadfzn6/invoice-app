"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useInvoiceStore } from "@/store/invoiceStore";
import { Save, User, Key, Bell, Palette, Database, Download, Upload, Trash2, Building2 } from "lucide-react";

export default function SettingsPage() {
  const { clients, invoices, currentUserId, setUserId } = useInvoiceStore();
  const [activeTab, setActiveTab] = useState<"akun" | "data" | "tampilan" | "backup">("akun");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [taxRate, setTaxRate] = useState(11);
  const [currency, setCurrency] = useState("IDR");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real app, this would save to Supabase
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const exportData = () => {
    const data = {
      clients,
      invoices,
      userId: currentUserId,
      settings: {
        userName,
        userEmail,
        companyName,
        companyAddress,
        companyPhone,
        companyEmail,
        taxRate,
        currency,
        theme,
      },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-app-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        // In a real app, this would restore to Supabase
        alert("Data berhasil diimpor! (Simulasi - data tidak benar-benar direstore di localStorage mode)");
      } catch {
        alert("File tidak valid");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClearAll = () => {
    if (confirm("PERINGATAN: Ini akan menghapus SEMUA data (client, invoice, pengaturan). Yakin?")) {
      if (confirm("Ini TIDAK dapat dibatalkan. Lanjutkan?")) {
        localStorage.removeItem("invoice-storage");
        window.location.reload();
      }
    }
  };

  const tabs = [
    { id: "akun", label: "Akun", icon: User },
    { id: "data", label: "Data Perusahaan", icon: Building2 },
    { id: "tampilan", label: "Tampilan", icon: Palette },
    { id: "backup", label: "Backup & Restore", icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 min-h-screen transition-all duration-300" style={{ marginLeft: "16rem" }}>
        <div className="p-6 lg:p-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Pengaturan</h1>
            <p className="mt-1 text-gray-500">Kelola pengaturan aplikasi dan data Anda</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex gap-4 p-4 overflow-x-auto" aria-label="Settings tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {saved && (
                <div className="mb-6 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <Save className="h-5 w-5" />
                  <span>Pengaturan berhasil disimpan</span>
                </div>
              )}

              {activeTab === "akun" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Profil Pengguna</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nama Anda"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="email@domain.com"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Keamanan</h2>
                    <div className="space-y-4">
                      <button className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Key className="h-4 w-4" />
                        Ganti Password
                      </button>
                      <button className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Bell className="h-4 w-4" />
                        Notifikasi
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "data" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Informasi Perusahaan</h2>
                  <p className="text-sm text-gray-500">Data ini akan muncul di invoice yang dibuat</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nama Perusahaan / Nama Anda"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                      <textarea
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Alamat lengkap perusahaan"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                        <input
                          type="text"
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="08xx-xxxx-xxxx"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="company@domain.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Pengaturan Invoice</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pajak Default (%)</label>
                        <input
                          type="number"
                          value={taxRate}
                          onChange={(e) => setTaxRate(Number(e.target.value))}
                          min={0}
                          max={100}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mata Uang</label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="IDR">IDR (Rupiah)</option>
                          <option value="USD">USD (Dollar)</option>
                          <option value="EUR">EUR (Euro)</option>
                          <option value="SGD">SGD (Singapore Dollar)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "tampilan" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Tema</h2>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { value: "light", label: "Terang", icon: "☀️" },
                      { value: "dark", label: "Gelap", icon: "🌙" },
                      { value: "system", label: "Sistem", icon: "💻" },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTheme(t.value as typeof theme)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          theme === t.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-3xl mb-2">{t.icon}</div>
                        <div className="font-medium text-gray-900">{t.label}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {t.value === "system" ? "Mengikuti pengaturan sistem" : `Mode ${t.label.toLowerCase()}`}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "backup" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Ekspor Data</h2>
                    <p className="text-sm text-gray-500 mb-4">Unduh semua data (client, invoice, pengaturan) sebagai file JSON</p>
                    <button
                      onClick={exportData}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Ekspor Data (JSON)
                    </button>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Impor Data</h2>
                    <p className="text-sm text-gray-500 mb-4">Pulihkan data dari file JSON yang diekspor sebelumnya</p>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="sr-only"
                        id="import-file"
                      />
                      <label
                        htmlFor="import-file"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Upload className="h-4 w-4" />
                        Pilih File JSON
                      </label>
                      <span className="text-sm text-gray-500">File JSON dari ekspor sebelumnya</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2 text-red-600">Zona Bahaya</h2>
                    <p className="text-sm text-gray-500 mb-4">Tindakan destruktif yang tidak dapat dibatalkan</p>
                    <button
                      onClick={handleClearAll}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus Semua Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}