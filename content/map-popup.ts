/** Layout a small card above its marker, leaving the country filters and marker accessible. */
export function mapPopupLayout(anchor:{x:number;y:number},map:{width:number;height:number},card:{width:number;height:number}) {
  const left=Math.max(card.width/2+12,Math.min(map.width-card.width/2-12,anchor.x));
  const targetY=Math.max(Math.min(map.height-28,card.height+90),Math.min(map.height-28,anchor.y));
  return {left,top:anchor.y-22,pointerX:Math.max(12,Math.min(card.width-12,card.width/2+anchor.x-left)),panBy:[anchor.x-left,anchor.y-targetY] as [number,number]};
}
