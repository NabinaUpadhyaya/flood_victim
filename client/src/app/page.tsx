'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Root page — redirects all users to /login.
 * Nobody can access the form without being authenticated.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  // Blank while redirecting
  return null;
}
