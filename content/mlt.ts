export type Collection = {
  id: string; number: string; name: string; eyebrow: string; promise: string;
  days: string; rate: string; mode: string; inclusions: string[];
};

export const collections: Collection[] = [
  { id: "freedom", number: "01", name: "Freedom", eyebrow: "Self-directed discovery", promise: "Your road. Your rhythm.", days: "7–30 days", rate: "From €1,490 for 7 days", mode: "Independent", inclusions: ["Luxury motorhome", "Curated map", "MLT route app", "Local recommendations"] },
  { id: "signature", number: "02", name: "Signature", eyebrow: "Curated, end to end", promise: "The journey, beautifully resolved.", days: "7–14 days", rate: "From €2,490 for 7 days", mode: "Tailored", inclusions: ["Personal route", "Reserved campsites", "Panoramic roads", "Restaurants & activities"] },
  { id: "concierge", number: "03", name: "Concierge", eyebrow: "Always one step ahead", promise: "Travel without interruption.", days: "7–14 days", rate: "From €4,990 for 7 days", mode: "Assisted 24/7", inclusions: ["24/7 online concierge", "Live route changes", "All campsites booked", "Excursions & dining reservations", "Technical support", "Large motorhome for 2–5 people"] },
  { id: "private", number: "04", name: "Private", eyebrow: "The rarest way to move", promise: "A private world, in motion.", days: "7–21 days", rate: "From €19,900 for 7 days", mode: "Fully hosted", inclusions: ["Private driver & technician", "Chef & service", "Half board", "VIP transfers & concierge"] },
  { id: "proposal", number: "05", name: "Proposal", eyebrow: "The art of saying yes", promise: "The art of saying yes at the edge of the world.", days: "3–7 days", rate: "Tailored proposal", mode: "Turnkey", inclusions: ["Premium motorhome", "Exclusive private location", "24/7 proposal concierge", "Complete on-site coordination"] },
];

export const destinations = ["Dolomites", "Lake Como", "Tyrol", "Bavaria"];

export const journeyRoutes = [
  { id: "dolomites-grand-tour", number: "01", name: "Dolomites Freedom Journey", country: "Italy", image: "/route-dolomites.jpg", tagline: { en: "Iconic passes and pure driving", de: "Ikonische Pässe und Fahrspaß", ru: "Культовые перевалы и драйв" } },
  { id: "lakes-of-bavaria", number: "02", name: "Bavaria Discovery Pass", country: "Germany", image: "/route-bavaria.jpg", tagline: { en: "Castles, lakes and freedom", de: "Schlösser, Seen und Freiheit", ru: "Замки, озера и свобода" } },
  { id: "alpine-escape", number: "03", name: "Alpine Escape Express", country: "Austria", image: "/route-alpine.jpg", tagline: { en: "Mountain energy and trekking", de: "Bergenergie und Trekking", ru: "Энергия гор и треккинг" } },
  { id: "wine-roads-collection", number: "04", name: "Wine Roads Horizon", country: "Italy", image: "/route-wine-roads.jpg", tagline: { en: "Wine roads and terroirs", de: "Weinstraßen und Terroirs", ru: "Винные дороги и терруары" } },
  { id: "mediterranean-discovery", number: "05", name: "Mediterranean Coastline", country: "Italy", image: "/route-mediterranean.jpg", tagline: { en: "Sea breeze and hidden coves", de: "Meeresbrise und Buchten", ru: "Морской бриз и бухты" } },
  { id: "winter-alps-expedition", number: "06", name: "Winter Alps Horizon", country: "Austria", image: "/route-winter-alps.jpg", tagline: { en: "Winter romance and ski slopes", de: "Winterromantik und Pisten", ru: "Зимняя романтика и трассы" } },
  { id: "black-forest-experience", number: "07", name: "Black Forest Trail", country: "Germany", image: "/route-black-forest.jpg", tagline: { en: "Forest roads and thermal spas", de: "Waldstraßen und Thermen", ru: "Лесные дороги и термы" } },
] as const;

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
  { id: "dolomites-grand-tour", country: "Italy", name: "Dolomites Freedom Journey", type: "Grand tour", className: "pin-dolomites" },
  { id: "lakes-of-bavaria", country: "Germany", name: "Bavaria Discovery Pass", type: "Lakeside journey", className: "pin-bavaria" },
  { id: "alpine-escape", country: "Austria", name: "Alpine Escape Express", type: "Mountain retreat", className: "pin-tyrol" },
  { id: "wine-roads-collection", country: "Italy", name: "Wine Roads Horizon", type: "Vineyard journey", className: "pin-tuscany" },
  { id: "mediterranean-discovery", country: "Italy", name: "Mediterranean Coastline", type: "Coastal journey", className: "pin-amalfi" },
  { id: "winter-alps-expedition", country: "Austria", name: "Winter Alps Horizon", type: "Winter journey", className: "pin-tyrol" },
  { id: "black-forest-experience", country: "Germany", name: "Black Forest Trail", type: "Forest journey", className: "pin-blackforest" },
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
