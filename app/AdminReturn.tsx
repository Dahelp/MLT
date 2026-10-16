"use client";
import {adminReturnRequired} from "../content/operations-access";
import {usePathname} from "next/navigation";
import {useEffect,useState} from "react";
import {useOperatorIdentity} from "./OperatorIdentity";
export default function AdminReturn(){
 const path=usePathname()||"";const enabled=adminReturnRequired("admin",path);const operator=useOperatorIdentity(enabled);const [locale,setLocale]=useState("en");
 useEffect(()=>{setLocale(localStorage.getItem("mlt-operations-locale")||"en")},[path]);
 if(!adminReturnRequired(operator?.role,path))return null;
 const text=locale==="ru"?"Вернуться: команда и доступ":locale==="de"?"Zurück: Team und Zugriff":"Back to team & access";
 return <aside className="admin-return-bar"><a href="/admin/team/">← {text}</a><span>{operator?.name}</span></aside>;
}
