import type { Locale } from "./i18n";
type PlaceTextField = "description" | "parking" | "booking" | "amenities";
export type PlaceTranslations = Partial<Record<Locale,Partial<Record<PlaceTextField,string>>>>;
const placeLocales = ["en","de","ru","it","pl"] as const;
const placeTextFields = ["description","parking","booking","amenities"] as const;

export type RoutePoint = {
  id: string; country: string; name: string; type: string; className: string;
  description?: string; descriptions?: Partial<Record<Locale,string>>;
  photos?: string[]; video?: {path: string; mime: string} | null;
  parking?: string; booking?: string; amenities?: string; recommended?: boolean; locationWebsite?: string; contactPhone?: string;
  translations?: PlaceTranslations;
};
export type PointResponse = {
  slug: string; title: string; country_name: string; latitude: string | number;
  longitude: string | number; category?: string; description?: string;
  image_path?: string; photos_json?: string | null; parking?: string; booking?: string; amenities?: string; recommended?: boolean; location_website?: string | null; contact_phone?: string | null;
  video?: {path?: unknown; mime?: unknown} | null;
  translations?: unknown;
};
const categoryNames: Record<string,string> = {gourmet:"Gourmet",stay:"Stay",sight:"Sight",experience:"Experience"};
const imagePath = (value: unknown): value is string => typeof value === "string" && /^(?:\/(?!\/)|https?:\/\/)/i.test(value);

export function placeWebsiteHref(value: unknown): string {
  if(typeof value!=="string"||!value.trim())return "";
  try{
    const url=new URL(value.trim());
    return ["https:","http:"].includes(url.protocol)&&!url.username&&!url.password?url.href:"";
  }catch{return "";}
}

export function placePhoneHref(value: string): string {
  const digits=value.replace(/\D/g,"");
  return digits?`tel:${value.trim().startsWith("+")?"+":""}${digits}`:"";
}

export function localizedRoutePoint(point: RoutePoint, locale: Locale): RoutePoint {
  const texts=point.translations?.[locale];
  if(!texts)return point;
  const translated={...point};
  for(const field of placeTextFields){
    if(typeof texts[field]==="string"&&texts[field]!.trim())translated[field]=texts[field];
  }
  return translated;
}

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
  const translations:PlaceTranslations={};
  if(row.translations&&typeof row.translations==="object"){
    for(const locale of placeLocales){
      const texts=(row.translations as PlaceTranslations)[locale];
      if(!texts||typeof texts!=="object")continue;
      for(const field of placeTextFields){
        if(field==="amenities"&&row.category!=="stay")continue;
        if(typeof texts[field]==="string"&&texts[field]!.trim())(translations[locale]??={})[field]=texts[field];
      }
    }
  }
  return {id:row.slug,name:row.title,country:row.country_name||"",type:categoryNames[row.category||""]||"MLT location",className:"pin-catalog",description:typeof row.description==="string"?row.description:"",photos:[...new Set(images)].slice(0,10),video,parking:typeof row.parking==="string"?row.parking:"",amenities:row.category==="stay"&&typeof row.amenities==="string"?row.amenities:"",booking:typeof row.booking==="string"?row.booking:"",recommended:row.recommended===true,locationWebsite:placeWebsiteHref(row.location_website),contactPhone:typeof row.contact_phone==="string"?row.contact_phone.trim():"",translations};
}
