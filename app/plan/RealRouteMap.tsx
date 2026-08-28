"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { mapPoints } from "../../content/mlt";

const coordinates: Record<string, [number, number]> = {
  como: [9.2572, 45.984], dolomites: [11.925, 46.54], tuscany: [11.17, 43.06], amalfi: [14.602, 40.634], tyrol: [11.39, 47.27], salzburg: [13.055, 47.81], vienna: [16.373, 48.208], bavaria: [11.08, 47.56], blackforest: [8.19, 48.1],
};
const views: Record<string, { center: [number, number]; zoom: number }> = {
  All: { center: [10.8, 46.2], zoom: 4.4 }, Italy: { center: [11.7, 43.7], zoom: 5.2 }, Austria: { center: [13.25, 47.55], zoom: 6.2 }, Germany: { center: [9.7, 49.6], zoom: 5.4 },
};
const countryFiles = ["italy", "austria", "germany"] as const;
type Locale = "en" | "de" | "ru";
type RouteGeometry = { type: "LineString"; coordinates: [number, number][] };
const labels = {
  en: { loading: "Loading map…", error: "Map tiles are temporarily unavailable.", routing: "Building route on real roads…", ready: "Road route ready", routeError: "Road route is temporarily unavailable", add: "Add", remove: "Remove" },
  de: { loading: "Karte wird geladen…", error: "Die Kartenansicht ist vorübergehend nicht verfügbar.", routing: "Route über reale Straßen wird berechnet…", ready: "Straßenroute ist bereit", routeError: "Die Straßenroute ist vorübergehend nicht verfügbar", add: "Hinzufügen", remove: "Entfernen" },
  ru: { loading: "Загружаем карту…", error: "Карта временно недоступна.", routing: "Строим маршрут по реальным дорогам…", ready: "Маршрут по дорогам готов", routeError: "Маршрутизатор временно недоступен", add: "Добавить", remove: "Удалить" },
} as const;

export default function RealRouteMap({ selected, country, onToggle, locale = "en", className = "" }: { selected: string[]; country: string; onToggle: (id: string) => void; locale?: Locale; className?: string }) {
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
    markersRef.current = mapPoints.map((point, index) => { const active = selected.includes(point.id); const button = document.createElement("button"); button.className = `real-map-marker${active ? " selected" : ""}${country !== "All" && country !== point.country ? " muted" : ""}`; button.type = "button"; button.setAttribute("aria-label", `${active ? t.remove : t.add} ${point.name}`); button.setAttribute("aria-pressed", String(active)); button.innerHTML = `<span>${active ? "✓" : index + 1}</span><b>${point.name}</b>`; button.onclick = () => toggleRef.current(point.id); return new maplibregl.Marker({ element: button, anchor: "center" }).setLngLat(coordinates[point.id]).addTo(map); });
  }, [selected, country, mapStatus, t]);
  useEffect(() => {
    const map = mapRef.current; if (!map || mapStatus !== "ready") return; const source = map.getSource("route") as maplibregl.GeoJSONSource; const controller = new AbortController();
    if (selected.length < 2) { source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } }); setRouteStatus("idle"); return () => controller.abort(); }
    setRouteStatus("loading"); const waypoints = selected.map((id) => coordinates[id].join(",")).join(";");
    fetch(`https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson&steps=false`, { signal: controller.signal }).then((response) => { if (!response.ok) throw new Error("Routing failed"); return response.json(); }).then((data: { code?: string; routes?: { geometry: RouteGeometry }[] }) => { if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("No route"); const geometry = data.routes[0].geometry; source.setData({ type: "Feature", properties: {}, geometry }); const bounds = geometry.coordinates.reduce((box, coordinate) => box.extend(coordinate), new maplibregl.LngLatBounds(geometry.coordinates[0], geometry.coordinates[0])); map.fitBounds(bounds, { padding: 70, maxZoom: 7.5, duration: 900 }); setRouteStatus("ready"); }).catch((error) => { if (error.name !== "AbortError") { source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } }); setRouteStatus("error"); } });
    return () => controller.abort();
  }, [selected, mapStatus]);
  return <div ref={container} className={`real-route-map ${className}`.trim()} aria-label="Interactive road route map of Italy, Austria and Germany">{mapStatus !== "ready" && <div className={`map-status ${mapStatus}`} role="status">{mapStatus === "error" ? t.error : t.loading}</div>}{mapStatus === "ready" && routeStatus !== "idle" && <div className={`route-calculation-status ${routeStatus}`} aria-live="polite">{routeStatus === "loading" ? t.routing : routeStatus === "ready" ? t.ready : t.routeError}</div>}</div>;
}
