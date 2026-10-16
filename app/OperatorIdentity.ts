"use client";
import {useEffect,useState} from "react";
export type OperatorIdentity={name:string;role:"admin"|"manager"|"salesmanager"|"concierge"};
const requests=new Map<string,Promise<OperatorIdentity>>();
export function operatorIdentity():Promise<OperatorIdentity>{
 const token=localStorage.getItem("mlt-account-token")||"";
 if(!token)return Promise.reject(new Error("Sign in required"));
 if(!requests.has(token))requests.set(token,fetch("/api/operator-session.php",{method:"POST",cache:"no-store",headers:{Authorization:`Bearer ${token}`}}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||"Access denied");return data.operator as OperatorIdentity}).catch(error=>{requests.delete(token);throw error}));
 return requests.get(token)!;
}
export function useOperatorIdentity(enabled=true){const [operator,setOperator]=useState<OperatorIdentity|null>(null);useEffect(()=>{let active=true;if(enabled)void operatorIdentity().then(value=>{if(active)setOperator(value)}).catch(()=>{});return()=>{active=false}},[enabled]);return operator;}
