import seed from "../public/data/acquisitions/mercedes-benz-v-300-marco-polo.json";
import type { Listing } from "../app/[locale]/acquisitions/Acquisitions";

export async function acquisitionInventory(): Promise<Listing[]> {
  try {
    const response = await fetch("https://mlt-lifestyle.com/api/acquisitions.php", {
      cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Inventory unavailable");
    const result = await response.json();
    if (!Array.isArray(result.items)) throw new Error("Invalid inventory");
    return result.items;
  } catch {
    // Offline local previews can still render the verified imported vehicle.
    return [{ ...seed, id: 0, type: "motorhome", status: "available" }];
  }
}
