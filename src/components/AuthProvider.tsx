"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSupabaseStore } from '@/store/supabaseStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { getSession, user, loading } = useSupabaseStore();

  useEffect(() => {
    getSession();
  }, [getSession]);

  useEffect(() => {
    if (!loading && !user && pathname !== '/auth') {
      router.push('/auth');
    }
    if (!loading && user && pathname === '/auth') {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Memuat…</div>
      </div>
    );
  }

  return <>{children}</>;
}