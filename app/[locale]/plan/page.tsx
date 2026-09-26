import { redirect } from "next/navigation";

export default async function LocalizedPlanPage({ params }: { params: Promise<{ locale: "en" | "de" | "ru" }> }) {
  const { locale } = await params;
  redirect(`/${locale}/account/`);
}
