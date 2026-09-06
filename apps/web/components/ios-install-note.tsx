'use client';

import { useEffect, useState } from 'react';
import { isIosDevice, isStandaloneDisplay } from '../lib/pwa';

export function IosInstallNote() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isIosDevice() && !isStandaloneDisplay());
  }, []);

  if (!show) return null;

  return (
    <div className="card ios-install-note">
      <h3>Aggiungi a Home</h3>
      <p>
        Su iPhone e iPad: apri Safari, tocca Condividi, poi <strong>Aggiungi a Home</strong>. STATWIN si
        apre come app, senza promettere vincite. 18+.
      </p>
    </div>
  );
}
