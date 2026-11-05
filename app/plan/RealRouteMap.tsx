"use client";

import { useEffect, useId, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { mapViews as views, mapCountryFiles as countryFiles, mapStatusLabels as labels, mapZoomLimits } from "../../content/map";
import { useRoutePoints } from "../useRoutePoints";
import { mapPreviewCopy } from "../../content/map-preview";
import MapPointPreview from "./MapPointPreview";
import NearbyMapPoints from "./NearbyMapPoints";
import { groupMapPoints, matchesMapCountry } from "../../content/map-markers";
import { mapMarkerCopy } from "../../content/map-marker-copy";
import { mapPopupLayout } from "../../content/map-popup";
import "./map-explorer.css";

type Locale = "en" | "de" | "ru" | "it" | "pl";
type RouteGeometry = { type: "LineString"; coordinates: [number, number][] };
export default function RealRouteMap({ selected, country, onToggle, locale = "en", className = "", onDistanceChange, selectable = true }: { selected: string[]; country: string; onToggle: (id: string) => void; locale?: Locale; className?: string; onDistanceChange?: (kilometres: number | null) => void; selectable?: boolean }) {
  const { points: mapPoints, coordinates } = useRoutePoints();
  const container = useRef<HTMLDivElement>(null); const mapRef = useRef<MapLibreMap | null>(null); const markersRef = useRef<Marker[]>([]);
  const inspectorRef=useRef<HTMLDivElement>(null),anchorRef=useRef<[number,number]|null>(null);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading"); const [routeStatus, setRouteStatus] = useState<"idle" | "loading" | "ready" | "error">("idle"); const t = labels[locale];
  const [previewId,setPreviewId]=useState<string|null>(null);
  const [nearbyIds,setNearbyIds]=useState<string[]|null>(null);
  const nearbySet=new Set(nearbyIds||[]),nearbyPoints=mapPoints.filter(point=>nearbySet.has(point.id));
  const preview=mapPoints.find(point=>point.id===previewId);
  const inspectorId=useId(),inspectorOpen=Boolean(preview||nearbyPoints.length);
  const closeInspector=()=>{anchorRef.current=null;setPreviewId(null);setNearbyIds(null);mapRef.current?.getCanvas().focus({preventScroll:true});};
  useEffect(()=>{anchorRef.current=null;setPreviewId(null);setNearbyIds(null);},[country]);
  useEffect(() => {
    if (!container.current || mapRef.current) return;
    // MapLibre v6 requires an explicit worker URL when bundled with Vite.
    maplibregl.setWorkerUrl(mapWorkerUrl);
    const map = new maplibregl.Map({ container: container.current, center: views.All.center, zoom: views.All.zoom, ...mapZoomLimits, attributionControl: false, style: { version: 8, sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } }, layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.2, "raster-contrast": 0.12, "raster-brightness-min": 0.58, "raster-brightness-max": 1 } }] } });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-left"); map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right"); mapRef.current = map;
    map.on("click",event=>{if(event.originalEvent.target===map.getCanvas()){anchorRef.current=null;setPreviewId(null);setNearbyIds(null);}});
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
    const map = mapRef.current; if (!map || mapStatus !== "ready") return;
    const byId=new Map(mapPoints.map(point=>[point.id,point])),selectedIds=new Set(selected);
    const renderMarkers=()=>{
      markersRef.current.forEach(marker=>marker.remove());
      const width=map.getContainer().clientWidth,height=map.getContainer().clientHeight;
      const visible=mapPoints.filter(point=>coordinates[point.id]&&matchesMapCountry(point.country,country)).flatMap(point=>{
        const projected=map.project(coordinates[point.id]);
        return projected.x>=-52&&projected.y>=-52&&projected.x<=width+52&&projected.y<=height+52?[{id:point.id,x:projected.x,y:projected.y,priority:point.id===previewId?0:point.className==="pin-catalog"?1:undefined}]:[];
      });
      markersRef.current=groupMapPoints(visible).map(group=>{
        const grouped=group.ids.length>1,anchored=Boolean(group.anchorId),point=byId.get(group.anchorId||group.ids[0])!;
        const active=anchored?selectedIds.has(point.id):group.ids.some(id=>selectedIds.has(id));
        const button=document.createElement("button"),symbol=document.createElement("span"),title=document.createElement("b");
        const groupLabel=mapMarkerCopy[locale].group.replace("{count}",String(group.ids.length)),label=grouped&&!anchored?groupLabel:point.name;
        const names=group.ids.slice(0,3).map(id=>byId.get(id)!.name).join(", ")+(group.ids.length>3?"…":"");
        button.type="button";button.className=`real-map-marker${active?" selected":""}${grouped&&!anchored?" is-group":""}`;
        button.setAttribute("aria-label",grouped&&!anchored?`${label}: ${names}`:`${mapPreviewCopy[locale].view} ${point.name}${grouped?` · ${groupLabel}`:""}`);
        button.setAttribute("aria-controls",inspectorId);button.setAttribute("aria-expanded",String(previewId?group.ids.includes(previewId):group.ids.some(id=>nearbyIds?.includes(id))));
        if(grouped&&!anchored||active)symbol.textContent=grouped&&!anchored?String(group.ids.length):"✓";
        else{
          const svg=document.createElementNS("http://www.w3.org/2000/svg","svg"),path=document.createElementNS("http://www.w3.org/2000/svg","path"),circle=document.createElementNS("http://www.w3.org/2000/svg","circle");
          svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("aria-hidden","true");path.setAttribute("d","M12 21s7-6.3 7-12A7 7 0 0 0 5 9c0 5.7 7 12 7 12Z");circle.setAttribute("cx","12");circle.setAttribute("cy","9");circle.setAttribute("r","2");svg.append(path,circle);symbol.append(svg);
        }
        title.textContent=grouped&&!anchored?names:`${label}${grouped?` · ${groupLabel}`:""}`;title.setAttribute("aria-hidden","true");button.append(symbol,title);
        if(grouped&&anchored){const badge=document.createElement("small");badge.className="real-map-marker-count";badge.textContent=String(group.ids.length);badge.setAttribute("aria-hidden","true");button.append(badge);}
        button.onclick=()=>{
          if(grouped&&anchored&&previewId===point.id){setNearbyIds(group.ids);setPreviewId(null);return;}
          if(!grouped&&previewId===point.id){anchorRef.current=null;setPreviewId(null);setNearbyIds(null);return;}
          const anchor=map.unproject([group.x,group.y]);anchorRef.current=[anchor.lng,anchor.lat];
          if(grouped&&!anchored){setNearbyIds(group.ids);setPreviewId(null);}else{setNearbyIds(grouped?group.ids:null);setPreviewId(point.id);}
        };
        return new maplibregl.Marker({element:button,anchor:"center"}).setLngLat(map.unproject([group.x,group.y])).addTo(map);
      });
    };
    renderMarkers();map.on("moveend",renderMarkers);map.on("resize",renderMarkers);
    return()=>{map.off("moveend",renderMarkers);map.off("resize",renderMarkers);markersRef.current.forEach(marker=>marker.remove());markersRef.current=[];};
  }, [selected, country, mapStatus, locale, mapPoints, coordinates, previewId, nearbyIds, inspectorId]);
  useEffect(()=>{
    const map=mapRef.current,node=inspectorRef.current;
    if(!map||!node||!inspectorOpen||!anchorRef.current)return;
    const host=node.parentElement?.parentElement,previousMinimum=host?.style.minHeight||"",baseHeight=map.getContainer().clientHeight;
    const position=()=>{
      if(!anchorRef.current)return;
      const layout=mapPopupLayout(map.project(anchorRef.current),{width:map.getContainer().clientWidth,height:map.getContainer().clientHeight},{width:node.offsetWidth,height:node.offsetHeight});
      node.style.left=`${layout.left}px`;node.style.top=`${layout.top}px`;
      node.style.setProperty("--map-pointer-x",`${layout.pointerX}px`);
    };
    map.on("move",position);map.on("resize",position);
    let frame=0,focused=false;
    const fit=()=>{
      if(!anchorRef.current)return;
      // Expanded visitor information grows the map instead of creating an inner scrollbar.
      if(previewId&&host)host.style.minHeight=`${Math.max(baseHeight,node.offsetHeight+118)}px`;
      map.resize();position();
      const {panBy}=mapPopupLayout(map.project(anchorRef.current!),{width:map.getContainer().clientWidth,height:map.getContainer().clientHeight},{width:node.offsetWidth,height:node.offsetHeight});
      // Pan only when opening a card; subsequent map gestures remain unrestricted.
      if(Math.abs(panBy[0])>1||Math.abs(panBy[1])>1)map.panBy(panBy,{duration:300});
      if(!focused){node.querySelector<HTMLElement>("[data-map-preview-focus],button")?.focus({preventScroll:true});focused=true;}
    };
    const scheduleFit=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(fit);};
    const resizeObserver=new ResizeObserver(scheduleFit);resizeObserver.observe(node);scheduleFit();
    position();
    return()=>{resizeObserver.disconnect();cancelAnimationFrame(frame);map.off("move",position);map.off("resize",position);if(host)host.style.minHeight=previousMinimum;};
  },[previewId,nearbyIds,inspectorOpen,mapStatus]);
  useEffect(() => {
    const map = mapRef.current; if (!map || mapStatus !== "ready") return; const source = map.getSource("route") as maplibregl.GeoJSONSource; const controller = new AbortController();
    if (selected.filter(id => coordinates[id]).length < 2) { source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } }); setRouteStatus("idle"); onDistanceChange?.(null); return () => controller.abort(); }
    setRouteStatus("loading"); onDistanceChange?.(null); const waypoints = selected.filter(id => coordinates[id]).map((id) => coordinates[id].join(",")).join(";");
    fetch(`https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson&steps=false`, { signal: controller.signal }).then((response) => { if (!response.ok) throw new Error("Routing failed"); return response.json(); }).then(async (data: { code?: string; routes?: { geometry: RouteGeometry; distance?: number }[] }) => { if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("No route"); const geometry = data.routes[0].geometry; await source.setData({ type: "Feature", properties: {}, geometry }); if (controller.signal.aborted) return; onDistanceChange?.(typeof data.routes[0].distance === "number" ? Math.round(data.routes[0].distance / 1000) : null); const bounds = geometry.coordinates.reduce((box, coordinate) => box.extend(coordinate), new maplibregl.LngLatBounds(geometry.coordinates[0], geometry.coordinates[0])); if(!anchorRef.current)map.fitBounds(bounds, { padding: 70, maxZoom: 7.5, duration: 900 }); setRouteStatus("ready"); }).catch((error) => { if (error.name !== "AbortError") { source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } }); onDistanceChange?.(null); setRouteStatus("error"); } });
    return () => controller.abort();
  }, [selected, mapStatus, onDistanceChange, coordinates]);
  return <div className={`real-route-map map-explorer ${className}${inspectorOpen?" has-place-inspector":""}`.trim()} aria-label={t.mapLabel} onKeyDown={event=>{if(event.key==="Escape"&&inspectorOpen){event.stopPropagation();closeInspector();}}}>
    <div ref={container} className="map-explorer-surface">{mapStatus !== "ready" && <div className={`map-status ${mapStatus}`} role="status">{mapStatus === "error" ? t.error : t.loading}</div>}{mapStatus === "ready" && routeStatus !== "idle" && <div className={`route-calculation-status ${routeStatus}`} aria-live="polite">{routeStatus === "loading" ? t.routing : routeStatus === "ready" ? t.ready : t.routeError}</div>}</div>
    <div ref={inspectorRef} id={inspectorId} className={`map-place-inspector${preview?"":" is-nearby"}`} hidden={!inspectorOpen}>
      {preview?<MapPointPreview key={preview.id} point={preview} locale={locale} selected={selected.includes(preview.id)} onSelect={selectable?onToggle:undefined} onClose={closeInspector} onBack={nearbyPoints.length?()=>setPreviewId(null):undefined}/>:nearbyPoints.length>0&&<NearbyMapPoints key={(nearbyIds||[]).join("|")} points={nearbyPoints} selected={selected} locale={locale} onClose={closeInspector} onPick={id=>{if(coordinates[id])anchorRef.current=coordinates[id];setPreviewId(id);}}/>}
    </div>
  </div>;
}
