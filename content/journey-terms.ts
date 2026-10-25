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
export function collectionTerms(id:string, upgraded=false, tourTotal=0, base=tourTotal):JourneyTerms|null {
  const variant=id==='freedom'&&upgraded?'freedom_plus':id==='signature'&&upgraded?'signature_tailored':id;
  const policy=pricing.policies[variant as keyof typeof pricing.policies];
  const planningFee=variant==='signature_tailored'?500:0;
  return policy?{version:1,variant,base,tourTotal,total:tourTotal+planningFee,planningFee,routeApproved:variant!=='signature_tailored',contractSigned:variant!=='private',protectionPercent:0,protectionAmount:0,protectionTerms:'',policy}:null;
}

export function journeyPaymentRows(t:JourneyTerms){
  let cumulative=0;
  return t.policy.stages.map((percent,index)=>{
    const previous=Math.round(t.tourTotal*cumulative)/100;cumulative+=percent;
    const amount=index===t.policy.stages.length-1?t.total-t.planningFee-previous:Math.round(t.tourTotal*cumulative)/100-previous;
    return {percent,amount,days:t.policy.dueDays[index]};
  });
}

/** Same favourable endpoints and advance basis as the server. No invented expense amounts. */
export function journeyCancellation(t:JourneyTerms,days:number,paid:number){
  if(t.protectionPercent>0)return {refund:null,retained:null};
  const planning=Math.min(paid,t.planningFee),refundable=Math.max(0,paid-planning);
  const row=t.policy.cancellation.find((r,i)=>(i===0?days>Number(r[0]):days>=Number(r[0]))||Number(r[0])===0)!;
  if(typeof row[1]!=='number'&&row[2]===undefined)return {refund:null,retained:null};
  const charge=typeof row[1]==='number'?(row[1]===100?refundable:t.tourTotal*t.policy.advance*row[1]/10000):Number(row[2]);
  const refund=Math.round(Math.max(0,refundable-charge)*100)/100;
  return {refund,retained:Math.round((paid-refund)*100)/100};
}
