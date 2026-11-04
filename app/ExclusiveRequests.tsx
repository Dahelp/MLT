'use client';

import type { Dispatch, SetStateAction } from 'react';
import { exclusiveRequestOptions, exclusiveCopy, parseExclusiveRequests } from '../content/exclusive-requests';
import styles from './exclusive-requests.module.css';

export function ExclusiveRequestSelection({ selected, onChange, locale }: { selected: string[]; onChange: Dispatch<SetStateAction<string[]>>; locale: string }) {
  return <fieldset className={styles.selection}>
    <legend>Exclusive Requests</legend>
    <div className={styles.grid}>{exclusiveRequestOptions.map(option => <button
      type="button" key={option.id} aria-pressed={selected.includes(option.id)}
      onClick={() => onChange(current => current.includes(option.id) ? current.filter(id => id !== option.id) : [...current, option.id])}
    >{option.title}</button>)}</div>
    <p>{exclusiveCopy(locale).empty}</p>
  </fieldset>;
}

export function ExclusiveRequestsSummary({ raw, locale }: { raw?: string | null; locale: string }) {
  const items = parseExclusiveRequests(raw), copy = exclusiveCopy(locale);
  if (!items.length) return null;
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
  const quoted = items.every(item => item.price !== null);
  return <div className={styles.summary}>
    <h3>Exclusive Requests</h3>
    <ul>{items.map(item => <li key={item.id}><span>{item.title}</span><strong>{item.price === null ? copy.pending : money(item.price)}</strong></li>)}</ul>
    {quoted && <p>{copy.total}: <strong>{money(items.reduce((total, item) => total + (item.price || 0), 0))}</strong><br/>{copy.included}</p>}
  </div>;
}
