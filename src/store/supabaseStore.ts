"use client";

import { create } from 'zustand';
import { createBrowserClient } from '@supabase/ssr';
import type { Client, Invoice, InvoiceItem } from '@/types/invoice';

// Lazy Supabase client - only created on client side
let supabase: ReturnType<typeof createBrowserClient> | null = null;

function getSupabase() {
  if (typeof window === 'undefined') return null;
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    supabase = createBrowserClient(url, key);
  }
  return supabase;
}

interface SupabaseStore {
  clients: Client[];
  invoices: Invoice[];
  user: { id: string; email: string } | null;
  loading: boolean;

  // Auth
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  getSession: () => Promise<void>;

  // Clients
  fetchClients: () => Promise<void>;
  addClient: (data: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Client | null>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // Invoices
  fetchInvoices: () => Promise<void>;
  addInvoice: (data: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Invoice | null>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
}

export const useSupabaseStore = create<SupabaseStore>((set, get) => ({
  clients: [],
  invoices: [],
  user: null,
  loading: true,

  async getSession() {
    const sb = getSupabase();
    if (!sb) { set({ loading: false }); return; }
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) {
      set({ user: { id: session.user.id, email: session.user.email! } });
      await Promise.all([get().fetchClients(), get().fetchInvoices()]);
    }
    set({ loading: false });
  },

  async signUp(email, password) {
    const sb = getSupabase();
    if (!sb) return { error: new Error('Supabase not configured') };
    const { error } = await sb.auth.signUp({ email, password });
    return { error };
  },

  async signIn(email, password) {
    const sb = getSupabase();
    if (!sb) return { error: new Error('Supabase not configured') };
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (!error) {
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) set({ user: { id: session.user.id, email: session.user.email! } });
      await Promise.all([get().fetchClients(), get().fetchInvoices()]);
    }
    return { error };
  },

  async signOut() {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    set({ user: null, clients: [], invoices: [] });
  },

  async fetchClients() {
    const sb = getSupabase();
    if (!sb) return;
    const { data, error } = await sb
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) set({ clients: data || [] });
  },

  async addClient(clientData) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const { data, error } = await sb
      .from('clients')
      .insert([{ ...clientData, user_id: user.id }])
      .select()
      .single();
    if (!error && data) {
      set(state => ({ clients: [data, ...state.clients] }));
      return data;
    }
    return null;
  },

  async updateClient(id, clientData) {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from('clients').update(clientData).eq('id', id);
    if (!error) {
      set(state => ({
        clients: state.clients.map(c => c.id === id ? { ...c, ...clientData } : c)
      }));
    }
  },

  async deleteClient(id) {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from('clients').delete().eq('id', id);
    if (!error) {
      set(state => ({
        clients: state.clients.filter(c => c.id !== id),
        invoices: state.invoices.filter(i => i.client_id !== id)
      }));
    }
  },

  async fetchInvoices() {
    const sb = getSupabase();
    if (!sb) return;
    const { data, error } = await sb
      .from('invoices')
      .select('*, clients(*)')
      .order('created_at', { ascending: false });
    if (!error) set({ invoices: data || [] });
  },

  async addInvoice(invoiceData) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const { data, error } = await sb
      .from('invoices')
      .insert([{ ...invoiceData, user_id: user.id }])
      .select()
      .single();
    if (!error && data) {
      set(state => ({ invoices: [data, ...state.invoices] }));
      return data;
    }
    return null;
  },

  async updateInvoice(id, invoiceData) {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from('invoices').update(invoiceData).eq('id', id);
    if (!error) {
      set(state => ({
        invoices: state.invoices.map(inv => inv.id === id ? { ...inv, ...invoiceData } : inv)
      }));
    }
  },

  async deleteInvoice(id) {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from('invoices').delete().eq('id', id);
    if (!error) {
      set(state => ({ invoices: state.invoices.filter(inv => inv.id !== id) }));
    }
  },
}));

// Listen auth changes
if (typeof window !== 'undefined') {
  const checkAndSetupListener = () => {
    const sb = getSupabase();
    if (sb) {
      sb.auth.onAuthStateChange(async (event: any, session: any) => {
        if (event === 'SIGNED_IN' && session?.user) {
          useSupabaseStore.setState({ user: { id: session.user.id, email: session.user.email! } });
          await Promise.all([
            useSupabaseStore.getState().fetchClients(),
            useSupabaseStore.getState().fetchInvoices()
          ]);
        } else if (event === 'SIGNED_OUT') {
          useSupabaseStore.setState({ user: null, clients: [], invoices: [] });
        }
      });
    }
  };
  // Run after a short delay to ensure env vars are loaded
  setTimeout(checkAndSetupListener, 100);
}

export function generateInvoiceNumber() {
  const { invoices } = useSupabaseStore.getState();
  const year = new Date().getFullYear();
  const count = invoices.length + 1;
  return `INV-${year}-${String(count).padStart(4, '0')}`;
}