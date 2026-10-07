import type { Locale } from "./i18n";

export type AccountJourneyDraft = {
  confirmationId?: string;
  collection: string;
  collectionName: string;
  country: string;
  days: number;
  arrival: string;
  departure: string;
  guests: number;
  route: string;
  rate: string;
  signatureTailored?: boolean;
  freedomPlus?: boolean;
  tailoredInterests?: string[];
  vehicle: string;
};

export function continueJourneyInAccount(draft: AccountJourneyDraft, locale: Locale) {
  localStorage.setItem("mlt-account-draft", JSON.stringify({ ...draft, confirmationId: crypto.randomUUID() }));
  window.location.assign(`/${locale}/account/?next=checkout`);
}
