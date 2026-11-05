import media from "../public/data/scout-media.json";
import {scoutCopy} from "./scout-i18n";
import type {Locale} from "./i18n";

export const scoutPhotoLimits={min:media.photoMin,max:media.photoMax,maxDataChars:media.photoMaxDataChars};
export function scoutPhotoSlots(existing:readonly string[]=[]):string[]{
  const photos=existing.slice(0,scoutPhotoLimits.max);
  return [...photos,...Array(Math.max(0,4-photos.length)).fill("")];
}
export function encodeScoutPhoto(canvas:HTMLCanvasElement,error:string):string{
  for(const quality of [.86,.74,.62,.5,.38,.26]){
    const result=canvas.toDataURL("image/jpeg",quality);
    if(result.length<=scoutPhotoLimits.maxDataChars)return result;
  }
  throw new Error(error);
}
/** Recompress older device drafts too, so ten portraits fit the existing API request limit. */
export async function prepareScoutPhotos(photos:readonly string[],locale:Locale):Promise<string[]>{
  const t=scoutCopy[locale],attached=photos.filter(Boolean),result:string[]=[];
  if(attached.length<scoutPhotoLimits.min||attached.length>scoutPhotoLimits.max)throw new Error(t.errors.photoCount);
  for(const photo of attached){
    if(!photo.startsWith("data:")||photo.length<=scoutPhotoLimits.maxDataChars){result.push(photo);continue;}
    const image=new Image();image.src=photo;await image.decode();
    const canvas=document.createElement("canvas");canvas.width=900;canvas.height=1200;
    const context=canvas.getContext("2d");if(!context)throw new Error(t.camera.prepareFailed);
    context.drawImage(image,0,0,900,1200);result.push(encodeScoutPhoto(canvas,t.camera.tooLarge));
  }
  return result;
}
