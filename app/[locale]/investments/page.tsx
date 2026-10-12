import Link from "next/link";
import type { SiteLocale } from "../layout";

export default async function InvestmentsPage({ params }: { params: Promise<{ locale: SiteLocale }> }) {
  const { locale } = await params;
  return <main className="upcoming-page"><Link href={`/${locale}/`} className="upcoming-brand"><img src="/mlt-logo.svg?v=20261006-vector" alt="MLT" /></Link><h1>Investments</h1><p>Coming soon</p><Link href={`/${locale}/`}>← Back to MLT</Link></main>;
}
