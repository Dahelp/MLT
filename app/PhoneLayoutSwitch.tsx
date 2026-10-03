"use client";

import { useEffect, useState, type ReactNode } from "react";

function isPhoneDevice(){
 const ua=navigator.userAgent;
 const ipad=/iPad/.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
 const androidTablet=/Android/.test(ua)&&!/Mobile/.test(ua);
 if(ipad||androidTablet)return false;
 if(/iPhone|iPod|Windows Phone|IEMobile|Opera Mini|Android.*Mobile/i.test(ua))return true;
 return navigator.maxTouchPoints>0&&Math.min(screen.width,screen.height)<600;
}

export default function PhoneLayoutSwitch({desktop,mobile}:{desktop:ReactNode;mobile:ReactNode}){
 const [phone,setPhone]=useState(false);
 useEffect(()=>setPhone(isPhoneDevice()),[]);
 return phone?mobile:desktop;
}
