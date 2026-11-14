"use client";

import type { ReactNode } from "react";
import type { Locale } from "../content/i18n";
import { collectionDestinations, collectionDestinationCopy, type CollectionDestinationId } from "../content/collection-destinations";

export function CollectionDestinationField({ locale, value, onChange, className, icon }: {
  locale: Locale;
  value: CollectionDestinationId;
  onChange: (value: CollectionDestinationId) => void;
  className?: string;
  icon?: ReactNode;
}) {
  const { label } = collectionDestinationCopy[locale];
  return <label className={className}>
    {icon && <i>{icon}</i>}
    <span>{label}</span>
    <select aria-label={label} value={value} onChange={event => onChange(event.target.value as CollectionDestinationId)}>
      {collectionDestinations.map(destination => <option key={destination.id} value={destination.id}>{destination.labels[locale]}</option>)}
    </select>
  </label>;
}

export function CollectionDestinationNotice({ locale }: { locale: Locale }) {
  return <p className="collection-destination-notice" role="status">{collectionDestinationCopy[locale].developing}</p>;
}
