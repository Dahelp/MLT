import type { Metadata } from "next";
import MobileHomePreview from "./MobileHomePreview";

export const metadata: Metadata = { title: "MLT — Mobile Homepage Preview", robots: { index: false, follow: false } };
export default function Page() { return <MobileHomePreview initialLocale="en" />; }
