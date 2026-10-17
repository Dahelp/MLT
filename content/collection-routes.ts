import { journeyRoutes } from "./mlt";
import type { Locale } from "./i18n";
import { routeTranslations } from "./route-translations";

const signatureRoutes = [
  { id: "signature-dolomites", number: "01", name: "Dolomites Signature Route", image: "/signature-route-dolomites.jpg", tagline: { en: "Boutique hotels and panoramic views", de: "Boutique-Hotels und Panoramablicke" } },
  { id: "signature-bavaria", number: "02", name: "Bavaria Signature Experience", image: "/signature-route-bavaria.jpg", tagline: { en: "Royal Sites and Tastings", de: "Königliche Sehenswürdigkeiten und Verkostungen" } },
  { id: "signature-alpine", number: "03", name: "Alpine Escape Signature", image: "/signature-route-alpine.jpg", tagline: { en: "Cozy Chalet and Spa Retreat", de: "Gemütliches Chalet und Spa-Auszeit" } },
  { id: "signature-wine", number: "04", name: "Wine Roads Signature Cellars", image: "/signature-route-wine.jpg", tagline: { en: "Top Wineries and Sommeliers", de: "Spitzenweingüter und Sommeliers" } },
  { id: "signature-mediterranean", number: "05", name: "Mediterranean Signature Riviera", image: "/signature-route-mediterranean.jpg", tagline: { en: "Yachts and signature restaurants", de: "Yachten und Signature-Restaurants" } },
  { id: "signature-winter", number: "06", name: "Winter Alps Signature", image: "/signature-route-winter.jpg", tagline: { en: "Ski pass and mountain chalet", de: "Skipass und Bergchalet" } },
  { id: "signature-black-forest", number: "07", name: "Black Forest Signature Retreat", image: "/signature-route-black-forest.jpg", tagline: { en: "Historic Sites and Thermal Baths", de: "Historische Stätten und Thermalbäder" } },
];
const conciergeFamilyRoutes = [
  { id: "family-dolomites", number: "01", name: "Family Dolomites Expedition", image: "/concierge-family-dolomites.jpg", tagline: "Effortless alpine peaks where we handle every detail" },
  { id: "family-bavaria", number: "02", name: "Bavaria Family Tales & Lakes", image: "/concierge-family-bavaria.jpg", tagline: "Seamless fairy-tale lakes fully orchestrated by us" },
  { id: "family-alpine", number: "03", name: "Alpine Family Sanctuary", image: "/concierge-family-alpine.jpg", tagline: "A secure family haven where we anticipate everything" },
  { id: "family-wine", number: "04", name: "Wine Roads Family Estates", image: "/concierge-family-wine.jpg", tagline: "Expertly curated vineyard discovery fully managed by us" },
  { id: "family-mediterranean", number: "05", name: "Mediterranean Family Riviera", image: "/concierge-family-mediterranean.jpg", tagline: "Sun-kissed coastal retreat with every detail handled by us" },
  { id: "family-winter", number: "06", name: "Winter Alps Family Wonderland", image: "/concierge-family-winter.jpg", tagline: "A magical snowbound escape completely arranged by us" },
  { id: "family-black-forest", number: "07", name: "Black Forest Family Forest & Lore", image: "/concierge-family-black-forest.jpg", tagline: "Enchanted woodland exploration entirely looked after by us" },
];
const honeymoonRoutes = [
  { id: "honeymoon-dolomites", number: "01", name: "Dolomites Peak Romance", image: "/honeymoon-dolomites.jpg", copy: { en: "Flowing Alpine roads, a panoramic plateau and sunset peaks shared in complete privacy.", de: "Sanfte Alpenstraßen, ein Panoramaplateau und Gipfel im Abendlicht — ganz für Sie allein.", ru: "Плавные серпантины альпийских дорог, парковка на панорамном плато, вечерний чай с видом на закатные вершины и полное ощущение уединения наедине друг с другом." } },
  { id: "honeymoon-bavaria", number: "02", name: "Bavarian Lake Serenade", image: "/honeymoon-bavaria.jpg", copy: { en: "Quiet lakeside stays, sunset walks to old castles and slow breakfasts by the water.", de: "Ruhige Stellplätze am See, Spaziergänge zu alten Schlössern und langsame Frühstücke am Wasser.", ru: "Уютные стоянки у зеркальной глади баварских озер, романтические прогулки на закате к старинным замкам и неспешные завтраки на террасе автодома." } },
  { id: "honeymoon-alpine", number: "03", name: "The Alpine Hideaway Route", image: "/honeymoon-alpine.jpg", copy: { en: "Hidden mountain valleys, pine-scented air and the feeling that the world belongs only to you.", de: "Verborgene Bergtäler, der Duft von Kiefern und das Gefühl, die Welt gehöre nur Ihnen.", ru: "Побег от городской суеты в скрытые от посторонних глаз горные долины, хвойный воздух, ковер из полевых цветов и абсолютная безопасность в пути." } },
  { id: "honeymoon-vineyards", number: "04", name: "Vineyards & Vows Journey", image: "/honeymoon-vineyards.jpg", copy: { en: "European wine roads, private tastings and intimate evenings beneath a sky full of stars.", de: "Europäische Weinstraßen, private Verkostungen und intime Abende unter dem Sternenhimmel.", ru: "Путешествие по живописным винодельческим дорогам Европы, парковка среди ухоженных лоз, дегустации местных вин и камерные вечера под звездным небом." } },
  { id: "honeymoon-riviera", number: "05", name: "Riviera Sunset Route", image: "/honeymoon-riviera.jpg", copy: { en: "Azure coves, sea-view terraces and the warm romantic rhythm of the Mediterranean.", de: "Türkisfarbene Buchten, Terrassen am Meer und der warme romantische Rhythmus des Mittelmeers.", ru: "Мягкий климат лазурного побережья, безопасные прибрежные террасы с видом на бирюзовые бухты, шум прибоя и средиземноморский романтический вайб." } },
  { id: "honeymoon-snow", number: "06", name: "Snowflake Alpine Dream", image: "/honeymoon-snow.jpg", copy: { en: "Snow-covered firs, warm lights, mulled wine and a cosy retreat after a winter walk.", de: "Verschneite Tannen, warmes Licht, Glühwein und ein gemütlicher Rückzugsort nach dem Winterspaziergang.", ru: "Зимняя сказка для двоих, заснеженные ели за панорамным окном автодома, теплый свет гирлянд, горячий глинтвейн и уют после прогулки." } },
  { id: "honeymoon-black-forest", number: "07", name: "Black Forest Fairy Tale", image: "/honeymoon-black-forest.jpg", copy: { en: "Secret forest roads, storybook landscapes and long evenings beneath whispering leaves.", de: "Geheime Waldstraßen, märchenhafte Landschaften und lange Abende unter rauschenden Blättern.", ru: "Таинственная и уютная атмосфера старинного леса, уединенные лесные дороги, сказочные пейзажи и вечерние разговоры у кемпера под шепот листвы." } },
];
const privateRoutes = [
  { id: "private-dolomites", number: "01", name: "Dolomites Grand Tour", image: "/private-route-dolomites.webp", tagline: { en: "Majestic alpine panoramas paired with flawless elite service", de: "Majestätische Alpenpanoramen mit makellosem Elite-Service", ru: "Величественные альпийские панорамы и безупречный элитный сервис" } },
  { id: "private-bavaria", number: "02", name: "Lakes of Bavaria", image: "/private-route-bavaria.webp", tagline: { en: "Royal tranquility along crystal-clear waters in absolute privacy", de: "Königliche Ruhe an kristallklaren Gewässern in absoluter Privatsphäre", ru: "Королевское спокойствие у кристально чистых озёр в полной приватности" } },
  { id: "private-alpine", number: "03", name: "Alpine Escape", image: "/private-route-alpine.webp", tagline: { en: "The ultimate high-altitude sanctuary of uncompromising comfort", de: "Ein alpiner Rückzugsort mit kompromisslosem Komfort", ru: "Высокогорное уединение с бескомпромиссным комфортом" } },
  { id: "private-wine", number: "04", name: "Wine Roads Collection", image: "/private-route-wine.webp", tagline: { en: "Private tastings across legendary vineyards reserved for the elite", de: "Private Verkostungen in legendären Weingütern, exklusiv für die Elite", ru: "Частные дегустации на легендарных виноградниках для избранных" } },
  { id: "private-mediterranean", number: "05", name: "Mediterranean Discovery", image: "/private-route-mediterranean.webp", tagline: { en: "Sun-drenched secluded coasts experienced in unmatched style", de: "Sonnenverwöhnte, verborgene Küsten in unvergleichlichem Stil", ru: "Солнечные уединённые побережья в непревзойдённом стиле" } },
  { id: "private-winter", number: "06", name: "Winter Alps Expedition", image: "/private-route-winter.webp", tagline: { en: "Pristine snowbound peaks paired with bespoke alpine luxury", de: "Unberührte verschneite Gipfel mit maßgeschneidertem Alpenluxus", ru: "Нетронутые снежные вершины и персональная альпийская роскошь" } },
  { id: "private-black-forest", number: "07", name: "Black Forest Experience", image: "/private-route-black-forest.webp", tagline: { en: "Enchanted ancient woodlands offering total seclusion and refinement", de: "Verwunschene alte Wälder mit vollkommener Abgeschiedenheit und Raffinesse", ru: "Древние волшебные леса, полное уединение и утончённость" } },
];

export function collectionRoutes(id: string, locale: Locale) {
  const source = id === "signature" ? signatureRoutes : id === "concierge" ? conciergeFamilyRoutes : id === "private" ? privateRoutes : id === "honeymoon" ? honeymoonRoutes : journeyRoutes;
  return source.map(route => {
    const text = "copy" in route ? route.copy : route.tagline;
    const description = routeTranslations[route.id]?.[locale] || (typeof text === "string" ? text : (text as Partial<Record<Locale, string>>)[locale] || text.en);
    return { id: route.id, number: route.number, name: route.name, image: route.image, description };
  });
}
