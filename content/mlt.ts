export type Collection = {
  id: string; number: string; name: string; eyebrow: string; promise: string;
  days: string; rate: string; mode: string; inclusions: string[];
};

export const collections: Collection[] = [
  { id: "freedom", number: "01", name: "Freedom", eyebrow: "Self-directed discovery", promise: "Your road. Your rhythm.", days: "7–30 days", rate: "€150–220 / day", mode: "Independent", inclusions: ["Luxury motorhome", "Curated map", "MLT route app", "Local recommendations"] },
  { id: "signature", number: "02", name: "Signature", eyebrow: "Curated, end to end", promise: "The journey, beautifully resolved.", days: "7–14 days", rate: "€250–400 / day", mode: "Tailored", inclusions: ["Personal route", "Reserved campsites", "Panoramic roads", "Restaurants & activities"] },
  { id: "concierge", number: "03", name: "Concierge", eyebrow: "Always one step ahead", promise: "Travel without interruption.", days: "7–15 days", rate: "€450–700 / day", mode: "Assisted 24/7", inclusions: ["Live route changes", "Dining reservations", "Excursions", "Roadside assistance"] },
  { id: "private", number: "04", name: "Private", eyebrow: "The rarest way to move", promise: "A private world, in motion.", days: "7–21 days", rate: "€2,000–4,000 / day", mode: "Fully hosted", inclusions: ["Private driver & technician", "Chef & service", "Half board", "VIP transfers & concierge"] },
];

export const destinations = ["Dolomites", "Lake Como", "Tyrol", "Bavaria"];

export const mapPoints = [
  { id: "como", country: "Italy", name: "Lake Como", type: "Lakeside stay", className: "pin-como" },
  { id: "dolomites", country: "Italy", name: "Dolomites", type: "Panoramic road", className: "pin-dolomites" },
  { id: "tuscany", country: "Italy", name: "Val d’Orcia", type: "Private vineyard", className: "pin-tuscany" },
  { id: "amalfi", country: "Italy", name: "Amalfi Coast", type: "Coastal retreat", className: "pin-amalfi" },
  { id: "tyrol", country: "Austria", name: "Tyrol", type: "Alpine lodge", className: "pin-tyrol" },
  { id: "salzburg", country: "Austria", name: "Salzburg Lakes", type: "Wild swimming", className: "pin-salzburg" },
  { id: "vienna", country: "Austria", name: "Vienna", type: "Private dining", className: "pin-vienna" },
  { id: "bavaria", country: "Germany", name: "Bavarian Alps", type: "Scenic route", className: "pin-bavaria" },
  { id: "blackforest", country: "Germany", name: "Black Forest", type: "Forest hideaway", className: "pin-blackforest" },
];

export const fleet = [
  { id: "explorer", number: "01", badge: "Available from September", category: "Grand touring", name: "MLT Explorer", rate: "from €220 / day", specs: ["4 guests", "Automatic", "7.8 m"], collection: "freedom", featured: false },
  { id: "granduca", number: "02", badge: "Signature choice", category: "Flagship residence", name: "MLT Granduca", rate: "from €390 / day", specs: ["4 guests", "Panoramic lounge", "8.7 m"], collection: "signature", featured: true },
  { id: "compatto", number: "03", badge: "Agile luxury", category: "Compact touring", name: "MLT Compatto", rate: "from €180 / day", specs: ["2 guests", "Automatic", "6.9 m"], collection: "freedom", featured: false },
];

export const experiences = [
  { id: "helicopter", number: "01", eyebrow: "Above the ordinary", title: "Private helicopter tours", detail: "Dolomites · Austrian Alps", className: "experience-heli" },
  { id: "wine", number: "02", eyebrow: "Behind closed doors", title: "Private wine tastings", detail: "Tuscany · South Tyrol", className: "experience-wine" },
  { id: "chef", number: "03", eyebrow: "Dinner, wherever you are", title: "Private chef experience", detail: "At your residence", className: "experience-chef" },
  { id: "yacht", number: "04", eyebrow: "A different horizon", title: "Luxury yacht charter", detail: "Lake Como · Amalfi", className: "experience-yacht" },
  { id: "transfer", number: "05", eyebrow: "Door to destination", title: "VIP airport transfer", detail: "Europe-wide", className: "experience-transfer" },
  { id: "photography", number: "06", eyebrow: "Remember it beautifully", title: "Private photographer", detail: "Full or half day", className: "experience-photo" },
];
