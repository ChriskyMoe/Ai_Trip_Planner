import { supabase } from './supabaseClient';

export async function checkAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session;
}

export async function requireAuth(redirectTo: string = '/auth') {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    return false;
  }
  return true;
}



