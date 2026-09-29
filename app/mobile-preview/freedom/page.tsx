import type { Metadata } from "next";
import FreedomMobilePreview from "./FreedomMobilePreview";

export const metadata: Metadata = {
  title: "MLT Freedom — Mobile Preview",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <FreedomMobilePreview />;
}
