import type { Locale } from "./i18n";

export type RoutePoint = {
  id: string; country: string; name: string; type: string; className: string;
  description?: string; descriptions?: Partial<Record<Locale,string>>;
  photos?: string[]; video?: {path: string; mime: string} | null;
  parking?: string; booking?: string;
};
export type PointResponse = {
  slug: string; title: string; country_name: string; latitude: string | number;
  longitude: string | number; category?: string; description?: string;
  image_path?: string; photos_json?: string | null; parking?: string; booking?: string;
  video?: {path?: unknown; mime?: unknown} | null;
};
const categoryNames: Record<string,string> = {gourmet:"Gourmet",stay:"Stay",sight:"Sight",experience:"Experience"};
const imagePath = (value: unknown): value is string => typeof value === "string" && /^(?:\/(?!\/)|https?:\/\/)/i.test(value);

/** Keep all published visitor content when adapting the map API response. */
export function publishedRoutePoint(row: PointResponse): RoutePoint | null {
  const lat=Number(row.latitude),lng=Number(row.longitude);
  if (row.latitude==null || row.longitude==null || !row.slug || typeof row.title!=="string" || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat)>90 || Math.abs(lng)>180) return null;
  let photos: unknown=[];
  try { photos=JSON.parse(row.photos_json||"[]"); } catch {}
  const images=Array.isArray(photos)?photos.filter(imagePath):[];
  if (!images.length && imagePath(row.image_path)) images.push(row.image_path);
  const video=row.video && typeof row.video.path==="string" && /^\/uploads\/scout-video\/[a-f0-9]{48}\.(?:mp4|mov|webm)$/.test(row.video.path)
    ? {path:row.video.path,mime:typeof row.video.mime==="string"?row.video.mime:""} : null;
  return {id:row.slug,name:row.title,country:row.country_name||"",type:categoryNames[row.category||""]||"MLT location",className:"pin-catalog",description:typeof row.description==="string"?row.description:"",photos:[...new Set(images)].slice(0,8),video,parking:typeof row.parking==="string"?row.parking:"",booking:typeof row.booking==="string"?row.booking:""};
}
