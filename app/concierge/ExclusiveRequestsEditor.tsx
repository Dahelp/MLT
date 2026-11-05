'use client';

import { useState } from 'react';
import { exclusiveCopy, parseExclusiveRequests } from '../../content/exclusive-requests';
import styles from '../exclusive-requests.module.css';

export default function ExclusiveRequestsEditor({ raw, reference, locale, disabled, request, onSaved }: {
  raw?: string; reference: string; locale: string; disabled: boolean;
  request: (action: string, payload: object) => Promise<unknown>; onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const items = parseExclusiveRequests(raw,locale), copy = exclusiveCopy(locale);
  if (!items.length) return null;
  return <form className={`journey-editor ${styles.editor}`} onSubmit={async event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setMessage('');
    try {
      await request('exclusive_requests_quote', { reference, items: items.map(item => ({ id: item.id, price: data.get(item.id) })) });
      await onSaved(); setMessage(copy.saved);
    } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }}>
    <h3>{copy.title}</h3>
    {items.map(item => <label key={item.id}>{item.title}<small>{copy.price}</small><input name={item.id} type="number" min="0" max="100000" step="0.01" required disabled={disabled || busy} defaultValue={item.price ?? ''}/></label>)}
    <small>{copy.included}</small>
    <button disabled={disabled || busy}>{copy.save}</button>
    <p role="status">{message}</p>
  </form>;
}
