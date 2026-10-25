import pricing from '../public/data/journey-pricing.json';
export type JourneyTerms = {
  version:number; variant:string; base:number; tourTotal:number; total:number;
  planningFee:number; routeApproved:boolean; contractSigned:boolean;
  protectionPercent:number; protectionAmount:number; protectionTerms:string;
  policy:{advance:number;security:number;label:string;stages:number[];dueDays:(number|null)[];cashFinal:boolean;cancellation:(number|string)[][]};
};
export function orderTerms(raw?:string|null):JourneyTerms|null {
  try { const value=JSON.parse(raw||'null');return value?.policy?value:null; } catch{return null;}
}
export function nextJourneyPayment(t:JourneyTerms, paid:number):number {
  if(t.planningFee>paid+.009)return Math.round((t.planningFee-paid)*100)/100;
  if(!t.routeApproved||!t.contractSigned)return 0;
  let target=t.planningFee;
  for(const [i,percent] of t.policy.stages.entries()){target+=t.tourTotal*percent/100;if(i===t.policy.stages.length-1)target=t.total;const due=Math.min(t.total,Math.round(target*100)/100)-paid;if(due>.009)return Math.round(due*100)/100;}
  return 0;
}
export function collectionTerms(id:string, upgraded=false):JourneyTerms|null {
  const variant=id==='freedom'&&upgraded?'freedom_plus':id==='signature'&&upgraded?'signature_tailored':id;
  const policy=pricing.policies[variant as keyof typeof pricing.policies];
  return policy?{version:1,variant,base:0,tourTotal:0,total:0,planningFee:variant==='signature_tailored'?500:0,routeApproved:variant!=='signature_tailored',contractSigned:variant!=='private',protectionPercent:0,protectionAmount:0,protectionTerms:'',policy}:null;
}
