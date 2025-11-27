'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * Client-side auth guard hook.
 * Returns true while session status is being verified so pages can render a loader.
 */
export function useRequireAuth() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/auth');
        return;
      }

      if (isMounted) {
        setChecking(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/auth');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return checking;
}


