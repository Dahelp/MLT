import type { Metadata } from "next";
import { fleet } from "../../../content/mlt";
import { FleetDetail } from "./FleetDetail";

export function generateStaticParams() { return fleet.map((vehicle) => ({ slug: vehicle.id })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const vehicle = fleet.find((item) => item.id === slug); return { title: vehicle ? `${vehicle.name} — MLT Fleet` : "MLT Fleet", description: vehicle ? `${vehicle.category}. ${vehicle.rate}.` : "MLT premium motorhome fleet" }; }
export default async function FleetPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const vehicle = fleet.find((item) => item.id === slug); if (!vehicle) return <main className="not-found"><h1>Motorhome not found</h1><a href="/">Return to MLT</a></main>; return <FleetDetail vehicle={vehicle} />; }
