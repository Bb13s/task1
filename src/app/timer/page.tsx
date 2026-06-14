'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TimerPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/timer/setup'); }, []);
  return null;
}
