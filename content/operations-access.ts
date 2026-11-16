/** Preserve an authorized destination without changing the signed-in identity. */
export function operationsDestination(role: string | undefined, next = ""): string {
  const chat=/^\/(?:admin|concierge|manager|sales)\/chat\/\?conversation=([1-9][0-9]*)$/.exec(next);
  if(chat && ["manager","salesmanager","concierge"].includes(role||""))return `/${role==="salesmanager"?"sales":role}/chat/?conversation=${chat[1]}`;
  const permitted=role==="admin" ? /^\/(admin|concierge|manager|sales)(\/|$)/.test(next) : role==="manager" ? /^\/manager(?:\/chat)?\/?(?:\?.*)?$/.test(next) : role==="salesmanager" ? /^\/sales(\/|$)/.test(next) : role==="concierge" ? /^\/concierge(\/|$)/.test(next) : false;
  if(permitted||(["manager","salesmanager","concierge"].includes(role||"")&&/^\/admin\/vouchers\/?$/.test(next)))return next;
  return role === "salesmanager" ? "/sales/" : role === "manager" ? "/manager/chat/" : role === "admin" ? "/admin/overview/" : "/concierge/overview/";
}

/** A return action is useful only when an administrator visits another role workspace. */
export function adminReturnRequired(role:string|undefined,path:string):boolean {return role==="admin"&&/^\/(concierge|manager|sales)(\/|$)/.test(path)}
