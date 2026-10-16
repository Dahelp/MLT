"use client";
import {usePathname} from "next/navigation";
import {useEffect,useState} from "react";
import {useOperatorIdentity} from "./OperatorIdentity";
export default function AdminReturn(){
 const path=usePathname()||"";const enabled=/^\/(admin|concierge|manager|sales)(\/|$)/.test(path);const operator=useOperatorIdentity(enabled);const [locale,setLocale]=useState("en");
 useEffect(()=>{setLocale(localStorage.getItem("mlt-operations-locale")||"en")},[path]);
 if(!enabled||operator?.role!=="admin"||path.startsWith("/admin/team"))return null;
 const text=locale==="ru"?"Вернуться: команда и доступ":locale==="de"?"Zurück: Team und Zugriff":"Back to team & access";
 return <aside className="admin-return-bar"><a href="/admin/team/">← {text}</a><span>{operator.name}</span></aside>;
}
