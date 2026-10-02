import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Client, Invoice, InvoiceItem } from '@/types/invoice'
import { v4 as uuidv4 } from 'uuid'

interface InvoiceStore {
  clients: Client[]
  invoices: Invoice[]
  currentUserId: string | null
  
  // Client actions
  addClient: (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Client
  updateClient: (id: string, data: Partial<Client>) => void
  deleteClient: (id: string) => void
  getClient: (id: string) => Client | undefined
  
  // Invoice actions
  addInvoice: (invoice: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Invoice
  updateInvoice: (id: string, data: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
  getInvoice: (id: string) => Invoice | undefined
  
  // Helpers
  getInvoicesByClient: (clientId: string) => Invoice[]
  getInvoicesByStatus: (status: Invoice['status']) => Invoice[]
  generateInvoiceNumber: () => string
  setUserId: (userId: string) => void
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      clients: [],
      invoices: [],
      currentUserId: null,
      
      setUserId: (userId: string) => set({ currentUserId: userId }),
      
      addClient: (clientData) => {
        const userId = get().currentUserId || 'local-user'
        const now = new Date().toISOString()
        const newClient: Client = {
          ...clientData,
          id: uuidv4(),
          user_id: userId,
          created_at: now,
          updated_at: now,
        }
        set((state) => ({ clients: [...state.clients, newClient] }))
        return newClient
      },
      
      updateClient: (id, data) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c
          ),
        }))
      },
      
      deleteClient: (id) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
          invoices: state.invoices.filter((inv) => inv.client_id !== id),
        }))
      },
      
      getClient: (id) => get().clients.find((c) => c.id === id),
      
      addInvoice: (invoiceData) => {
        const userId = get().currentUserId || 'local-user'
        const now = new Date().toISOString()
        const newInvoice: Invoice = {
          ...invoiceData,
          id: uuidv4(),
          user_id: userId,
          created_at: now,
          updated_at: now,
        }
        set((state) => ({ invoices: [...state.invoices, newInvoice] }))
        return newInvoice
      },
      
      updateInvoice: (id, data) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...data, updated_at: new Date().toISOString() } : inv
          ),
        }))
      },
      
      deleteInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
        }))
      },
      
      getInvoice: (id) => get().invoices.find((inv) => inv.id === id),
      
      getInvoicesByClient: (clientId) =>
        get().invoices.filter((inv) => inv.client_id === clientId),
      
      getInvoicesByStatus: (status) =>
        get().invoices.filter((inv) => inv.status === status),
      
      generateInvoiceNumber: () => {
        const year = new Date().getFullYear()
        const count = get().invoices.length + 1
        return `INV-${year}-${String(count).padStart(4, '0')}`
      },
    }),
    {
      name: 'invoice-storage',
      partialize: (state) => ({
        clients: state.clients,
        invoices: state.invoices,
        currentUserId: state.currentUserId,
      }),
    }
  )
)