import {recommendationLabel} from "../../content/place-recommendation";
import type {OperationsLocale} from "../../content/operations-i18n";
import "./place-recommendation.css";

export default function PlaceRecommendation({checked,disabled,locale,onChange}:{checked:boolean;disabled?:boolean;locale:OperationsLocale;onChange:(value:boolean)=>void}){
  return <label className="place-recommendation"><input type="checkbox" name="recommended" checked={checked} disabled={disabled} onChange={event=>onChange(event.target.checked)}/><span>{recommendationLabel[locale]}</span></label>;
}
