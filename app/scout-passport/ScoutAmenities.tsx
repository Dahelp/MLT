import type {Locale} from "../../content/i18n";
import {scoutCopy} from "../../content/scout-i18n";
export default function ScoutAmenities({category,value,locale,onChange}:{category:string;value:string;locale:Locale;onChange:(value:string)=>void}){
  if(category!=="stay")return null;
  const t=scoutCopy[locale].form;
  return <label>{t.amenities}<textarea name="amenities" maxLength={1500} rows={2} value={value} placeholder={t.amenitiesPlaceholder} onChange={event=>onChange(event.target.value)}/></label>;
}
