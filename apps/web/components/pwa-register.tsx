'use client';

import { useEffect, useState } from 'react';

export function PwaRegister() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="offline-banner" role="status">
      Sei offline. STATWIN mostra solo le pagine già aperte in cache. Nessun risultato viene inventato.
    </div>
  );
}
