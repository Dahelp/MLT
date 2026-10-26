import type { Locale } from "../content/i18n";
import { useRoutePoints } from "./useRoutePoints";
import { mapCopy } from "../content/map";

type Props = {
  locale: Locale;
  selected: string[];
  distance: number | null;
  onToggle: (id: string) => void;
  variant?: "main" | "mobile";
  className?: string;
  itemClassName?: string;
};

export default function MapSelectionList({ locale, selected, distance, onToggle, variant = "main", className = "", itemClassName = "" }: Props) {
  const { points: mapPoints } = useRoutePoints();
  const t = mapCopy[locale];
  const places = selected.flatMap(id => { const point = mapPoints.find(item => item.id === id); return point ? [point] : []; });
  const heading = <>{variant === "mobile" ? <b>{t.selected}</b> : <small>{t.selected}</small>}<span>{places.length} / {mapPoints.length}</span></>;
  const rows = places.length ? places.map((point, index) => variant === "mobile"
    ? <div className={itemClassName} key={point.id}><i>{index + 1}</i><span>{point.name}</span><button type="button" onClick={() => onToggle(point.id)} aria-label={`${t.remove} ${point.name}`}>×</button></div>
    : <button key={point.id} type="button" onClick={() => onToggle(point.id)} aria-label={`${t.remove} ${point.name}`}><span>{index + 1}</span>{point.name}<b aria-hidden="true">×</b></button>) : <p>{t.empty}</p>;
  return <div className={variant === "mobile" ? className : `smart-map-selection ${className}`.trim()}>
    {variant === "mobile" ? <header>{heading}</header> : <div className="smart-map-selection-heading">{heading}</div>}
    {variant === "mobile" ? rows : <div>{rows}</div>}
    {distance !== null && <strong className={variant === "main" ? "smart-map-distance" : undefined} aria-live="polite">{t.distance} {distance.toLocaleString(locale)} km</strong>}
  </div>;
}
