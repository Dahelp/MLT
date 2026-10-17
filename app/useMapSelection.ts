"use client";

import { useCallback, useState } from "react";
import { mapPoints } from "../content/mlt";

export function useMapSelection() {
  const [country, setCountry] = useState("All");
  const [selected, setSelected] = useState<string[]>(["dolomites", "como"]);
  const [distance, setDistance] = useState<number | null>(null);
  const toggle = useCallback((id: string) => {
    if (!mapPoints.some(point => point.id === id)) return;
    setDistance(null);
    setSelected(current => current.includes(id) ? current.filter(point => point !== id) : [...current, id]);
  }, []);
  const onDistanceChange = useCallback((value: number | null) => setDistance(value), []);
  return { country, setCountry, selected, distance, toggle, onDistanceChange };
}
