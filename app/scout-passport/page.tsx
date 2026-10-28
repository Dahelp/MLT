import type { Metadata } from "next";
import ScoutPassport from "./ScoutPassport";
import "./scout.css";

export const metadata: Metadata = {
  title: "MLT Scout Passport",
  description: "Curate. Capture. Contribute to the MLT route. Паспорт локации для скаутов MLT.",
  alternates: { canonical: "/scout-passport/" },
  referrer: "no-referrer",
};

export default function Page() {
  return <ScoutPassport />;
}
