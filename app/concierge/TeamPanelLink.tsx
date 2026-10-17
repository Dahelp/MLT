"use client";
export default function TeamPanelLink({role,label}:{role:string;label:string}){
 const href=role==="admin"?"/admin/overview/":role==="concierge"?"/concierge/overview/":role==="salesmanager"?"/sales/":"/manager/chat/";
 return <a className={`team-panel-link role-${role}`} href={href}>{label}<span aria-hidden="true"> ↗</span></a>;
}
