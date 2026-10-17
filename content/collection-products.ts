import type { Locale } from "./i18n";
import type { CatalogItem } from "./catalog-client";
import { collectionRoutes } from "./collection-routes";
import { parseCatalogData } from "./journey-pricing";

/** Both sites read the same active catalog records, with the same editorial fallback. */
export function collectionProducts(id: string, locale: Locale, catalog: CatalogItem[]) {
  const fallback = collectionRoutes(id, locale);
  const rows = catalog.filter(item => item.item_type === "product" && item.collection_id === id && item.is_active !== false && Number(item.is_active ?? 1) !== 0)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  if (!rows.length) return fallback;
  return rows.map((item, index) => {
    const original = fallback.find(route => route.id === item.slug);
    const data = parseCatalogData(item.data_json);
    return {
      id: item.slug || `product-${index}`,
      number: String(index + 1).padStart(2, "0"),
      name: String(data[`title_${locale}`] || item.title || original?.name || "MLT journey"),
      image: String(item.image_path || data.image || original?.image || `/collection-${id}.webp`),
      description: String(data[`description_${locale}`] || data.description || original?.description || item.subtitle || ""),
    };
  });
}

export function mobileCollectionProducts(id: string, locale: Locale, catalog: CatalogItem[]) {
  return collectionProducts(id, locale, catalog).map(product => ({
    id: product.id, n: product.number, title: product.name, image: product.image,
    copy: { en: product.description, de: product.description, ru: product.description, it: product.description, pl: product.description },
  }));
}
