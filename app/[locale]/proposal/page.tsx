import ProposalPage from "../../proposal/page";
import type { Locale } from "../../../content/i18n";

export default async function LocalizedProposalPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <ProposalPage initialSiteLocale={locale} />;
}
