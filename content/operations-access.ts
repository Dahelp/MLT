/** Preserve an authorized destination without changing the signed-in identity. */
export function operationsDestination(role: string | undefined, next = ""): string {
  const sections = role === "admin" ? ["admin", "concierge", "manager", "sales"] : role === "manager" ? ["manager"] : role === "salesmanager" ? ["sales", "manager"] : role === "concierge" ? ["concierge"] : [];
  if (sections.some(section => next === `/${section}` || next.startsWith(`/${section}/`))) return next;
  return role === "salesmanager" ? "/sales/acquisitions/" : role === "manager" ? "/manager/" : role === "admin" ? "/admin/overview/" : "/concierge/overview/";
}

/** A return action is useful only when an administrator visits another role workspace. */
export function adminReturnRequired(role:string|undefined,path:string):boolean {return role==="admin"&&/^\/(concierge|manager|sales)(\/|$)/.test(path)}
