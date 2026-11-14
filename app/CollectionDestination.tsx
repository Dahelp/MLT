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
  const { developing } = collectionDestinationCopy[locale];
  const separator = locale === "it" ? ": " : " - ";
  const [title, invitation] = developing.split(separator);
  const countryStart = invitation.lastIndexOf(" ", invitation.lastIndexOf(" / ") - 1) + 1;
  return <div className="collection-destination-notice" role="status" aria-label={developing}>
    <p className="collection-destination-title">{title}</p>
    <p className="collection-destination-invitation">{invitation.slice(0, countryStart)}<span className="collection-destination-origin">{invitation.slice(countryStart)}</span></p>
  </div>;
}
