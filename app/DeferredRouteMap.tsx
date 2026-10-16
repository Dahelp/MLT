"use client";
import { useEffect, useRef, useState, type ComponentProps, type ComponentType } from "react";
import type RealRouteMap from "./plan/RealRouteMap";
type Props = ComponentProps<typeof RealRouteMap>;
/** Keep map code and tile requests out of the initial hero load. */
export default function DeferredRouteMap(props: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [Map, setMap] = useState<ComponentType<Props> | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => { void import("./plan/RealRouteMap").then(module => { if (active) setMap(() => module.default); }).catch(() => {}); };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); }
    }, { rootMargin: "600px" });
    if (root.current) observer.observe(root.current);
    return () => { active = false; observer.disconnect(); };
  }, []);
  return <div ref={root} className="deferred-route-map">{Map ? <Map {...props} /> : <div className={`real-route-map ${props.className || ""}`} aria-label="Map" />}</div>;
}
