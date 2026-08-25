import PlanPage from "../../plan/page";

export default async function LocalizedPlanPage({ params }: { params: Promise<{ locale: "en" | "de" | "ru" }> }) {
  const { locale } = await params;
  return <PlanPage initialLocale={locale} />;
}
