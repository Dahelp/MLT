"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { mapPoints } from "../../content/mlt";

const coordinates: Record<string, [number, number]> = {
  como: [9.2572, 45.984], dolomites: [11.925, 46.54], tuscany: [11.17, 43.06], amalfi: [14.602, 40.634],
  tyrol: [11.39, 47.27], salzburg: [13.055, 47.81], vienna: [16.373, 48.208], bavaria: [11.08, 47.56], blackforest: [8.19, 48.1],
};
const views: Record<string, { center: [number, number]; zoom: number }> = {
  All: { center: [11.3, 46.4], zoom: 4.8 }, Italy: { center: [11.7, 43.7], zoom: 5.2 }, Austria: { center: [13.25, 47.55], zoom: 6.2 }, Germany: { center: [9.7, 48.4], zoom: 5.7 },
};

export default function RealRouteMap({ selected, country, onToggle }: { selected: string[]; country: string; onToggle: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null); const mapRef = useRef<MapLibreMap | null>(null); const markersRef = useRef<Marker[]>([]); const toggleRef = useRef(onToggle);
  useEffect(() => { toggleRef.current = onToggle; }, [onToggle]);
  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({ container: container.current, center: views.All.center, zoom: views.All.zoom, minZoom: 4, maxZoom: 12, attributionControl: false, style: { version: 8, sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } }, layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.82, "raster-contrast": 0.16, "raster-brightness-min": 0.06, "raster-brightness-max": 0.68 } }] } });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-left"); map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right"); mapRef.current = map;
    map.on("load", () => { map.addSource("route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } } }); map.addLayer({ id: "route-glow", type: "line", source: "route", paint: { "line-color": "#d8a57c", "line-width": 7, "line-opacity": .18 } }); map.addLayer({ id: "route-line", type: "line", source: "route", paint: { "line-color": "#d8a57c", "line-width": 2, "line-dasharray": [2, 2] } }); });
    return () => { markersRef.current.forEach((marker) => marker.remove()); map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => { const map = mapRef.current; if (!map) return; const view = views[country] || views.All; map.flyTo({ center: view.center, zoom: view.zoom, duration: 850 }); }, [country]);
  useEffect(() => {
    const map = mapRef.current; if (!map) return; markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = mapPoints.map((point, index) => { const active = selected.includes(point.id); const button = document.createElement("button"); button.className = `real-map-marker${active ? " selected" : ""}${country !== "All" && country !== point.country ? " muted" : ""}`; button.type = "button"; button.setAttribute("aria-label", `${active ? "Remove" : "Add"} ${point.name}`); button.innerHTML = `<span>${active ? "✓" : index + 1}</span><b>${point.name}</b>`; button.onclick = () => toggleRef.current(point.id); return new maplibregl.Marker({ element: button, anchor: "center" }).setLngLat(coordinates[point.id]).addTo(map); });
    const update = () => { const source = map.getSource("route") as maplibregl.GeoJSONSource | undefined; if (source) source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: selected.map((id) => coordinates[id]) } }); }; map.isStyleLoaded() ? update() : map.once("load", update);
  }, [selected, country]);
  return <div ref={container} className="real-route-map" aria-label="Interactive map of MLT destinations" />;
}
