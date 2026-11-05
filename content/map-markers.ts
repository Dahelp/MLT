export type MapScreenPoint = {id: string; x: number; y: number; priority?: number};
export type MapPointGroup = {ids: string[]; x: number; y: number; anchorId?: string};

/** Keep marker hit areas apart at the current zoom, including identical coordinates. */
export function groupMapPoints(points: MapScreenPoint[], spacing = 52): MapPointGroup[] {
  if (!Number.isFinite(spacing) || spacing <= 0) throw new RangeError("Invalid marker spacing");
  type Anchor = {id: string; x: number; y: number; priority: number};
  type Group = MapPointGroup & {sumX: number; sumY: number; anchor?: Anchor};
  const cells = new Map<string, Set<Group>>(), groups = new Set<Group>();
  const key = (x: number, y: number) => `${Math.floor(x / spacing)}:${Math.floor(y / spacing)}`;
  const remove = (group: Group) => {
    const cellKey = key(group.x, group.y), cell = cells.get(cellKey);
    cell?.delete(group); if (!cell?.size) cells.delete(cellKey);
    groups.delete(group);
  };
  const neighbours = (x: number, y: number) => {
    const found: Group[] = [], cx = Math.floor(x / spacing), cy = Math.floor(y / spacing);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      for (const group of cells.get(`${cx + dx}:${cy + dy}`) || []) {
        if (Math.hypot(group.x - x, group.y - y) < spacing) found.push(group);
      }
    }
    return found;
  };
  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    let group: Group = {ids: [point.id], x: point.x, y: point.y, sumX: point.x, sumY: point.y};
    if (Number.isFinite(point.priority)) group.anchor = {id: point.id, x: point.x, y: point.y, priority: point.priority!};
    // Recheck after merging: moving a cluster centre can bring another marker within reach.
    let near = neighbours(group.x, group.y);
    while (near.length) {
      for (let other of near) {
        remove(other);
        if (other.ids.length > group.ids.length) { const smaller = group; group = other; other = smaller; }
        group.sumX += other.sumX; group.sumY += other.sumY;
        for (const id of other.ids) group.ids.push(id);
        if (other.anchor && (!group.anchor || other.anchor.priority < group.anchor.priority || other.anchor.priority === group.anchor.priority && other.anchor.id < group.anchor.id)) group.anchor = other.anchor;
      }
      group.x = group.anchor?.x ?? group.sumX / group.ids.length; group.y = group.anchor?.y ?? group.sumY / group.ids.length;
      near = neighbours(group.x, group.y);
    }
    const cellKey = key(group.x, group.y);
    if (!cells.has(cellKey)) cells.set(cellKey, new Set());
    cells.get(cellKey)!.add(group); groups.add(group);
  }
  return [...groups].map(({ids, x, y, anchor}) => ({ids, x, y, ...(anchor ? {anchorId: anchor.id} : {})}));
}

const countryNames: Record<string, string[]> = {
  Italy: ["italy", "italia", "italien", "италия", "włochy", "it"],
  Austria: ["austria", "österreich", "австрия", "at"],
  Germany: ["germany", "deutschland", "germania", "германия", "niemcy", "de"],
};
export function matchesMapCountry(value: string, country: string) {
  if (country === "All") return true;
  const name = value.normalize("NFKC").trim().toLowerCase();
  return (countryNames[country] || [country.toLowerCase()]).some(alias => name === alias || name.startsWith(alias) && /^[\s,;/·—–-]/u.test(name.slice(alias.length)));
}
