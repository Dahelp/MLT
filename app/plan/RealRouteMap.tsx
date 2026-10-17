"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { mapCoordinates as coordinates, mapViews as views, mapCountryFiles as countryFiles, mapStatusLabels as labels } from "../../content/map";
import { mapPoints } from "../../content/mlt";

type Locale = "en" | "de" | "ru" | "it" | "pl";
type RouteGeometry = { type: "LineString"; coordinates: [number, number][] };
export default function RealRouteMap({ selected, country, onToggle, locale = "en", className = "", onDistanceChange }: { selected: string[]; country: string; onToggle: (id: string) => void; locale?: Locale; className?: string; onDistanceChange?: (kilometres: number | null) => void }) {
  const container = useRef<HTMLDivElement>(null); const mapRef = useRef<MapLibreMap | null>(null); const markersRef = useRef<Marker[]>([]); const toggleRef = useRef(onToggle);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading"); const [routeStatus, setRouteStatus] = useState<"idle" | "loading" | "ready" | "error">("idle"); const t = labels[locale];
  useEffect(() => { toggleRef.current = onToggle; }, [onToggle]);
  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({ container: container.current, center: views.All.center, zoom: views.All.zoom, minZoom: 4, maxZoom: 12, attributionControl: false, style: { version: 8, sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } }, layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.2, "raster-contrast": 0.12, "raster-brightness-min": 0.58, "raster-brightness-max": 1 } }] } });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-left"); map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right"); mapRef.current = map;
    map.on("load", () => {
      for (const name of countryFiles) { map.addSource(`country-${name}`, { type: "geojson", data: `/data/countries/${name}.geojson` }); map.addLayer({ id: `country-${name}-fill`, type: "fill", source: `country-${name}`, paint: { "fill-color": "#d48a4b", "fill-opacity": 0.045 } }); map.addLayer({ id: `country-${name}-line`, type: "line", source: `country-${name}`, paint: { "line-color": "#a45f28", "line-width": 2.1, "line-opacity": 0.82 } }); }
      map.addSource("route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } } }); map.addLayer({ id: "route-glow", type: "line", source: "route", paint: { "line-color": "#fff8ed", "line-width": 8, "line-opacity": 0.76 } }); map.addLayer({ id: "route-line", type: "line", source: "route", paint: { "line-color": "#a75f2b", "line-width": 4, "line-opacity": 1 } }); map.resize(); setMapStatus("ready");
    });
    map.on("error", (event) => { if (event.error) setMapStatus((current) => current === "loading" ? "error" : current); });
    const resizeObserver = new ResizeObserver(() => map.resize()); resizeObserver.observe(container.current);
    return () => { resizeObserver.disconnect(); markersRef.current.forEach((marker) => marker.remove()); map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => { const map = mapRef.current; if (!map || mapStatus !== "ready") return; const view = views[country] || views.All; map.flyTo({ center: view.center, zoom: view.zoom, duration: 850 }); }, [country, mapStatus]);
  useEffect(() => {
    const map = mapRef.current; if (!map || mapStatus !== "ready") return; markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = mapPoints.map((point, index) => { const active = selected.includes(point.id); const button = document.createElement("button"); button.className = `real-map-marker${active ? " selected" : ""}${country !== "All" && country !== point.country ? " muted" : ""}`; button.type = "button"; button.setAttribute("aria-label", `${active ? t.remove : t.add} ${point.name}`); button.setAttribute("aria-pressed", String(active)); button.innerHTML = `<span>${active ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3.2 3.2L13 4.5"/></svg>' : index + 1}</span><b>${point.name}</b>`; button.onclick = () => toggleRef.current(point.id); return new maplibregl.Marker({ element: button, anchor: "center" }).setLngLat(coordinates[point.id]).addTo(map); });
  }, [selected, country, mapStatus, t]);
  useEffect(() => {
    const map = mapRef.current; if (!map || mapStatus !== "ready") return; const source = map.getSource("route") as maplibregl.GeoJSONSource; const controller = new AbortController();
    if (selected.filter(id => coordinates[id]).length < 2) { source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } }); setRouteStatus("idle"); onDistanceChange?.(null); return () => controller.abort(); }
    setRouteStatus("loading"); onDistanceChange?.(null); const waypoints = selected.filter(id => coordinates[id]).map((id) => coordinates[id].join(",")).join(";");
    fetch(`https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson&steps=false`, { signal: controller.signal }).then((response) => { if (!response.ok) throw new Error("Routing failed"); return response.json(); }).then((data: { code?: string; routes?: { geometry: RouteGeometry; distance?: number }[] }) => { if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("No route"); const geometry = data.routes[0].geometry; source.setData({ type: "Feature", properties: {}, geometry }); onDistanceChange?.(typeof data.routes[0].distance === "number" ? Math.round(data.routes[0].distance / 1000) : null); const bounds = geometry.coordinates.reduce((box, coordinate) => box.extend(coordinate), new maplibregl.LngLatBounds(geometry.coordinates[0], geometry.coordinates[0])); map.fitBounds(bounds, { padding: 70, maxZoom: 7.5, duration: 900 }); setRouteStatus("ready"); }).catch((error) => { if (error.name !== "AbortError") { source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } }); onDistanceChange?.(null); setRouteStatus("error"); } });
    return () => controller.abort();
  }, [selected, mapStatus, onDistanceChange]);
  return <div ref={container} className={`real-route-map ${className}`.trim()} aria-label="Interactive road route map of Italy, Austria and Germany">{mapStatus !== "ready" && <div className={`map-status ${mapStatus}`} role="status">{mapStatus === "error" ? t.error : t.loading}</div>}{mapStatus === "ready" && routeStatus !== "idle" && <div className={`route-calculation-status ${routeStatus}`} aria-live="polite">{routeStatus === "loading" ? t.routing : routeStatus === "ready" ? t.ready : t.routeError}</div>}</div>;
}
