"use client";
import type {ReactNode} from "react";
import {usePathname} from "next/navigation";
import OperationsShell from "../OperationsShell";
import {useOperatorIdentity} from "../OperatorIdentity";
import type {OperationsSection} from "../../content/operations-navigation";

export default function AdminLayout({children}: {children: ReactNode}) {
  const pathname = usePathname() || "/admin/";
  const section = pathname.split("/").filter(Boolean)[1] || "overview";
  const operator = useOperatorIdentity();
  const scope = operator?.role === "salesmanager" ? "sales" : operator?.role === "manager" ? "manager" : operator?.role === "concierge" ? "concierge" : "admin";
  return <OperationsShell persistent scope={scope} active={(section === "acquisitions" ? "sales" : section) as OperationsSection} operator={operator}>{children}</OperationsShell>;
}
